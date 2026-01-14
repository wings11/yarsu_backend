import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Oracle connection configuration
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING, // Format: host:port/service_name
  // Connection pool settings
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60
};

let pool = null;

/**
 * Initialize the Oracle connection pool
 */
export async function initializePool() {
  try {
    // For Oracle Cloud or thin mode (no Oracle Client needed)
    oracledb.initOracleClient(); // Remove this line if using thin mode
    
    pool = await oracledb.createPool(dbConfig);
    console.log('Oracle connection pool created successfully');
    return pool;
  } catch (error) {
    console.error('Error creating Oracle connection pool:', error);
    throw error;
  }
}

/**
 * Get a connection from the pool
 */
export async function getConnection() {
  if (!pool) {
    await initializePool();
  }
  return await pool.getConnection();
}

/**
 * Execute a query with optional bind parameters
 * @param {string} sql - SQL query to execute
 * @param {object|array} binds - Bind parameters
 * @param {object} options - Additional options
 * @returns {Promise<object>} Query result
 */
export async function executeQuery(sql, binds = {}, options = {}) {
  let connection;
  try {
    connection = await getConnection();
    
    const defaultOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT, // Return rows as objects
      autoCommit: true,
      ...options
    };
    
    const result = await connection.execute(sql, binds, defaultOptions);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

/**
 * Execute an INSERT and return the generated ID
 * @param {string} sql - INSERT SQL statement
 * @param {object} binds - Bind parameters
 * @param {string} idColumn - Name of the ID column for RETURNING clause
 * @returns {Promise<number>} The generated ID
 */
export async function executeInsert(sql, binds = {}, idColumn = 'id') {
  let connection;
  try {
    connection = await getConnection();
    
    // Add RETURNING clause if not present
    const returningClause = ` RETURNING ${idColumn} INTO :insertedId`;
    const fullSql = sql.includes('RETURNING') ? sql : sql + returningClause;
    
    const fullBinds = {
      ...binds,
      insertedId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };
    
    const result = await connection.execute(fullSql, fullBinds, { autoCommit: true });
    
    return result.outBinds.insertedId[0];
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

/**
 * Execute multiple statements in a transaction
 * @param {Function} callback - Function that receives connection and executes statements
 * @returns {Promise<any>} Result from callback
 */
export async function executeTransaction(callback) {
  let connection;
  try {
    connection = await getConnection();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

/**
 * Close the connection pool (call on app shutdown)
 */
export async function closePool() {
  if (pool) {
    try {
      await pool.close(10); // 10 second drain time
      console.log('Oracle connection pool closed');
    } catch (error) {
      console.error('Error closing pool:', error);
    }
  }
}

export default {
  initializePool,
  getConnection,
  executeQuery,
  executeInsert,
  executeTransaction,
  closePool
};
