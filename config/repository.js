/**
 * Database Repository Layer
 * Provides helper functions for common database operations
 * with proper handling of Oracle-specific features (CLOB, JSON arrays, booleans)
 */

import { executeQuery, executeInsert, executeTransaction } from './database.js';
import oracledb from 'oracledb';

/**
 * Convert JavaScript boolean to Oracle NUMBER(1)
 */
export function boolToOracle(value) {
  if (value === null || value === undefined) return null;
  return value ? 1 : 0;
}

/**
 * Convert Oracle NUMBER(1) to JavaScript boolean
 */
export function oracleToBool(value) {
  if (value === null || value === undefined) return null;
  return value === 1;
}

/**
 * Convert array to JSON string for storing in CLOB
 */
export function arrayToJson(arr) {
  if (!arr) return '[]';
  return JSON.stringify(Array.isArray(arr) ? arr : []);
}

/**
 * Parse JSON string from CLOB to array
 */
export function jsonToArray(jsonStr) {
  if (!jsonStr) return [];
  try {
    // Handle CLOB objects from Oracle
    if (typeof jsonStr === 'object' && jsonStr.getData) {
      jsonStr = jsonStr.getData();
    }
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
}

/**
 * Read CLOB content as string
 */
export async function readClob(clob) {
  if (!clob) return null;
  if (typeof clob === 'string') return clob;
  
  return new Promise((resolve, reject) => {
    let content = '';
    clob.setEncoding('utf8');
    clob.on('data', (chunk) => { content += chunk; });
    clob.on('end', () => resolve(content));
    clob.on('error', reject);
  });
}

/**
 * Process a row from Oracle, converting CLOBs and booleans
 */
export async function processRow(row, config = {}) {
  const processed = { ...row };
  
  // Convert specified fields from CLOB to parsed JSON
  if (config.jsonFields) {
    for (const field of config.jsonFields) {
      if (processed[field] !== undefined) {
        const content = await readClob(processed[field]);
        processed[field] = jsonToArray(content);
      }
    }
  }
  
  // Convert specified fields from NUMBER(1) to boolean
  if (config.boolFields) {
    for (const field of config.boolFields) {
      if (processed[field] !== undefined) {
        processed[field] = oracleToBool(processed[field]);
      }
    }
  }
  
  // Read CLOB text fields
  if (config.clobFields) {
    for (const field of config.clobFields) {
      if (processed[field] !== undefined) {
        processed[field] = await readClob(processed[field]);
      }
    }
  }
  
  // Convert field names from uppercase to lowercase/camelCase
  if (config.lowercaseKeys) {
    const lowercased = {};
    for (const key of Object.keys(processed)) {
      lowercased[key.toLowerCase()] = processed[key];
    }
    return lowercased;
  }
  
  return processed;
}

/**
 * Process multiple rows
 */
export async function processRows(rows, config = {}) {
  return Promise.all(rows.map(row => processRow(row, config)));
}

/**
 * Generic repository class for a table
 */
export class Repository {
  constructor(tableName, config = {}) {
    this.tableName = tableName;
    this.idColumn = config.idColumn || 'id';
    this.jsonFields = config.jsonFields || [];
    this.boolFields = config.boolFields || [];
    this.clobFields = config.clobFields || [];
  }

  /**
   * Find all records
   */
  async findAll(options = {}) {
    const orderBy = options.orderBy || `${this.idColumn} DESC`;
    const limit = options.limit;
    
    let sql = `SELECT * FROM ${this.tableName} ORDER BY ${orderBy}`;
    
    if (limit) {
      sql = `SELECT * FROM (${sql}) WHERE ROWNUM <= :limit`;
    }
    
    const binds = limit ? { limit } : {};
    const result = await executeQuery(sql, binds);
    
    return processRows(result.rows || [], {
      jsonFields: this.jsonFields,
      boolFields: this.boolFields,
      clobFields: this.clobFields,
      lowercaseKeys: true
    });
  }

  /**
   * Find by ID
   */
  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = :id`;
    const result = await executeQuery(sql, { id });
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    return processRow(result.rows[0], {
      jsonFields: this.jsonFields,
      boolFields: this.boolFields,
      clobFields: this.clobFields,
      lowercaseKeys: true
    });
  }

  /**
   * Find records matching conditions
   */
  async findWhere(conditions, options = {}) {
    const whereClauses = [];
    const binds = {};
    
    Object.entries(conditions).forEach(([key, value], index) => {
      const bindName = `p${index}`;
      whereClauses.push(`${key.toUpperCase()} = :${bindName}`);
      binds[bindName] = value;
    });
    
    const orderBy = options.orderBy || `${this.idColumn} DESC`;
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const sql = `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY ${orderBy}`;
    const result = await executeQuery(sql, binds);
    
    return processRows(result.rows || [], {
      jsonFields: this.jsonFields,
      boolFields: this.boolFields,
      clobFields: this.clobFields,
      lowercaseKeys: true
    });
  }

  /**
   * Find single record matching conditions
   */
  async findOneWhere(conditions) {
    const results = await this.findWhere(conditions, { limit: 1 });
    return results[0] || null;
  }

  /**
   * Insert a new record
   */
  async insert(data) {
    const processedData = this._processDataForInsert(data);
    const columns = Object.keys(processedData);
    const bindNames = columns.map((_, i) => `:p${i}`);
    
    const binds = {};
    columns.forEach((col, i) => {
      binds[`p${i}`] = processedData[col];
    });
    
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${bindNames.join(', ')})`;
    const insertedId = await executeInsert(sql, binds, this.idColumn);
    
    return this.findById(insertedId);
  }

  /**
   * Update a record by ID
   */
  async update(id, data) {
    const processedData = this._processDataForInsert(data);
    const setClauses = [];
    const binds = { id };
    
    Object.entries(processedData).forEach(([key, value], index) => {
      const bindName = `p${index}`;
      setClauses.push(`${key} = :${bindName}`);
      binds[bindName] = value;
    });
    
    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    const sql = `UPDATE ${this.tableName} SET ${setClauses.join(', ')} WHERE ${this.idColumn} = :id`;
    await executeQuery(sql, binds);
    
    return this.findById(id);
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    // First get the record to return it
    const record = await this.findById(id);
    if (!record) return null;
    
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = :id`;
    await executeQuery(sql, { id });
    
    return record;
  }

  /**
   * Count records
   */
  async count(conditions = {}) {
    const whereClauses = [];
    const binds = {};
    
    Object.entries(conditions).forEach(([key, value], index) => {
      const bindName = `p${index}`;
      whereClauses.push(`${key.toUpperCase()} = :${bindName}`);
      binds[bindName] = value;
    });
    
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) AS cnt FROM ${this.tableName} ${whereClause}`;
    
    const result = await executeQuery(sql, binds);
    return result.rows[0]?.CNT || 0;
  }

  /**
   * Process data before insert/update - convert booleans and arrays
   */
  _processDataForInsert(data) {
    const processed = {};
    
    for (const [key, value] of Object.entries(data)) {
      const upperKey = key.toUpperCase();
      
      // Skip undefined values
      if (value === undefined) continue;
      
      // Convert arrays to JSON
      if (this.jsonFields.includes(upperKey) || this.jsonFields.includes(key)) {
        processed[upperKey] = arrayToJson(value);
      }
      // Convert booleans to 0/1
      else if (this.boolFields.includes(upperKey) || this.boolFields.includes(key)) {
        processed[upperKey] = boolToOracle(value);
      }
      // Keep other values as-is
      else {
        processed[upperKey] = value;
      }
    }
    
    return processed;
  }
}

// ============================================
// Pre-configured Repositories for each table
// ============================================

export const usersRepo = new Repository('users', {
  idColumn: 'id'
});

export const jobsRepo = new Repository('jobs', {
  idColumn: 'id',
  jsonFields: ['MEDIA'],
  boolFields: ['PINKCARD', 'THAI', 'PAYMENT_TYPE', 'STAY', 'TREAT']
});

export const userInquiriesRepo = new Repository('user_inquiries', {
  idColumn: 'id',
  boolFields: ['THAILANGUAGE', 'GENDER']
});

export const condosRepo = new Repository('condos', {
  idColumn: 'id',
  jsonFields: ['IMAGES'],
  boolFields: ['SWIMMING_POOL', 'FREE_WIFI', 'GYM', 'GARDEN', 'CO_WORKING_SPACE'],
  clobFields: ['NOTES']
});

export const coursesRepo = new Repository('courses', {
  idColumn: 'id',
  clobFields: ['NOTES']
});

export const docsRepo = new Repository('docs', {
  idColumn: 'id',
  jsonFields: ['MEDIA'],
  clobFields: ['TEXT']
});

export const generalRepo = new Repository('general', {
  idColumn: 'id',
  jsonFields: ['MEDIA'],
  clobFields: ['TEXT']
});

export const highlightsRepo = new Repository('highlights', {
  idColumn: 'id'
});

export const hotelsRepo = new Repository('hotels', {
  idColumn: 'id',
  jsonFields: ['NEARBY_FAMOUS_PLACES', 'IMAGES'],
  boolFields: ['BREAKFAST', 'FREE_WIFI', 'SWIMMING_POOL']
});

export const linksRepo = new Repository('links', {
  idColumn: 'id'
});

export const restaurantsRepo = new Repository('restaurants', {
  idColumn: 'id',
  jsonFields: ['IMAGES', 'POPULAR_PICKS']
});

export const travelPostsRepo = new Repository('travel_posts', {
  idColumn: 'id',
  jsonFields: ['HIGHLIGHTS', 'IMAGES'],
  clobFields: ['NOTES']
});

export const pushTokensRepo = new Repository('noti_push_tokens', {
  idColumn: 'id',
  boolFields: ['ENABLED']
});

export const refreshTokensRepo = new Repository('refresh_tokens', {
  idColumn: 'id'
});

export default {
  usersRepo,
  jobsRepo,
  userInquiriesRepo,
  condosRepo,
  coursesRepo,
  docsRepo,
  generalRepo,
  highlightsRepo,
  hotelsRepo,
  linksRepo,
  restaurantsRepo,
  travelPostsRepo,
  pushTokensRepo,
  refreshTokensRepo,
  Repository,
  boolToOracle,
  oracleToBool,
  arrayToJson,
  jsonToArray,
  processRow,
  processRows
};
