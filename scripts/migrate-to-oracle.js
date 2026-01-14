/**
 * Data Migration Script: Supabase PostgreSQL -> Oracle
 * 
 * This script exports data from Supabase and imports it into Oracle.
 * Run this AFTER creating the Oracle schema.
 * 
 * Usage:
 *   1. Set environment variables for both databases
 *   2. Run: node scripts/migrate-to-oracle.js --export  (exports to JSON files)
 *   3. Run: node scripts/migrate-to-oracle.js --import  (imports from JSON files)
 *   4. Run: node scripts/migrate-to-oracle.js --full    (export + import in one go)
 */

import { createClient } from '@supabase/supabase-js';
import oracledb from 'oracledb';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const ORACLE_CONFIG = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING
};

const EXPORT_DIR = path.join(__dirname, '../migration_data');

// Tables to migrate (in order for foreign key dependencies)
const TABLES = [
  {
    name: 'users',
    idColumn: 'id',
    boolFields: [],
    arrayFields: []
  },
  {
    name: 'jobs',
    idColumn: 'id',
    boolFields: ['pinkcard', 'thai', 'payment_type', 'stay', 'treat'],
    arrayFields: ['media']
  },
  {
    name: 'user_inquiries',
    idColumn: 'id',
    boolFields: ['thailanguage', 'gender'],
    arrayFields: []
  },
  {
    name: 'condos',
    idColumn: 'id',
    boolFields: ['swimming_pool', 'free_wifi', 'gym', 'garden', 'co_working_space'],
    arrayFields: ['images']
  },
  {
    name: 'courses',
    idColumn: 'id',
    boolFields: [],
    arrayFields: []
  },
  {
    name: 'docs',
    idColumn: 'id',
    boolFields: [],
    arrayFields: ['media']
  },
  {
    name: 'general',
    idColumn: 'id',
    boolFields: [],
    arrayFields: ['media']
  },
  {
    name: 'highlights',
    idColumn: 'id',
    boolFields: [],
    arrayFields: []
  },
  {
    name: 'hotels',
    idColumn: 'id',
    boolFields: ['breakfast', 'free_wifi', 'swimming_pool'],
    arrayFields: ['nearby_famous_places', 'images']
  },
  {
    name: 'links',
    idColumn: 'id',
    boolFields: [],
    arrayFields: []
  },
  {
    name: 'restaurants',
    idColumn: 'id',
    boolFields: [],
    arrayFields: ['images', 'popular_picks']
  },
  {
    name: 'travel_posts',
    idColumn: 'id',
    boolFields: [],
    arrayFields: ['highlights', 'images']
  },
  {
    name: 'noti_push_tokens',
    idColumn: 'id',
    boolFields: ['enabled'],
    arrayFields: []
  }
];

// ============================================
// Export Functions
// ============================================

async function exportFromSupabase() {
  console.log('🚀 Starting export from Supabase...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Create export directory
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  
  const summary = {};

  for (const table of TABLES) {
    try {
      console.log(`📦 Exporting ${table.name}...`);
      
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .order(table.idColumn, { ascending: true });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        summary[table.name] = { status: 'error', error: error.message };
        continue;
      }

      const filePath = path.join(EXPORT_DIR, `${table.name}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      console.log(`   ✅ Exported ${data.length} rows`);
      summary[table.name] = { status: 'success', count: data.length };
    } catch (err) {
      console.error(`   ❌ Unexpected error: ${err.message}`);
      summary[table.name] = { status: 'error', error: err.message };
    }
  }

  // Write summary
  await fs.writeFile(
    path.join(EXPORT_DIR, '_summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n📊 Export Summary:');
  console.table(summary);
  
  return summary;
}

// ============================================
// Import Functions
// ============================================

async function importToOracle() {
  console.log('🚀 Starting import to Oracle...\n');
  
  let connection;
  const summary = {};

  try {
    // Connect to Oracle
    console.log('🔌 Connecting to Oracle...');
    connection = await oracledb.getConnection(ORACLE_CONFIG);
    console.log('   ✅ Connected\n');

    for (const table of TABLES) {
      try {
        console.log(`📥 Importing ${table.name}...`);
        
        // Read exported data
        const filePath = path.join(EXPORT_DIR, `${table.name}.json`);
        let data;
        
        try {
          const fileContent = await fs.readFile(filePath, 'utf8');
          data = JSON.parse(fileContent);
        } catch (readErr) {
          console.log(`   ⏭️ No export file found, skipping`);
          summary[table.name] = { status: 'skipped', reason: 'no export file' };
          continue;
        }

        if (data.length === 0) {
          console.log(`   ⏭️ No data to import`);
          summary[table.name] = { status: 'skipped', reason: 'empty' };
          continue;
        }

        // Get columns from first row
        const columns = Object.keys(data[0]);
        
        let imported = 0;
        let errors = 0;

        for (const row of data) {
          try {
            const processedRow = processRowForOracle(row, table);
            await insertRow(connection, table.name, processedRow);
            imported++;
          } catch (insertErr) {
            errors++;
            if (errors <= 3) {
              console.error(`   ⚠️ Row error: ${insertErr.message}`);
            }
          }
        }

        await connection.commit();
        
        // Update sequence to max ID + 1
        if (table.idColumn === 'id' && typeof data[0]?.id === 'number') {
          await updateSequence(connection, table.name, data);
        }

        console.log(`   ✅ Imported ${imported}/${data.length} rows${errors > 0 ? ` (${errors} errors)` : ''}`);
        summary[table.name] = { status: 'success', imported, total: data.length, errors };
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        summary[table.name] = { status: 'error', error: err.message };
      }
    }

  } finally {
    if (connection) {
      await connection.close();
    }
  }

  console.log('\n📊 Import Summary:');
  console.table(summary);
  
  return summary;
}

/**
 * Process a row for Oracle insertion
 */
function processRowForOracle(row, tableConfig) {
  const processed = {};
  
  for (const [key, value] of Object.entries(row)) {
    const upperKey = key.toUpperCase();
    
    if (value === null || value === undefined) {
      processed[upperKey] = null;
      continue;
    }
    
    // Convert boolean to 0/1
    if (tableConfig.boolFields.includes(key)) {
      processed[upperKey] = value ? 1 : 0;
    }
    // Convert array to JSON string
    else if (tableConfig.arrayFields.includes(key)) {
      processed[upperKey] = JSON.stringify(value || []);
    }
    // Convert JSON object to string
    else if (tableConfig.jsonFields?.includes(key)) {
      processed[upperKey] = JSON.stringify(value || {});
    }
    // Convert Date objects
    else if (value instanceof Date) {
      processed[upperKey] = value;
    }
    // Convert ISO date strings to Date objects
    else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) {
      processed[upperKey] = new Date(value);
    }
    // Keep as-is
    else {
      processed[upperKey] = value;
    }
  }
  
  return processed;
}

/**
 * Insert a single row into Oracle
 */
async function insertRow(connection, tableName, row) {
  const columns = Object.keys(row);
  const bindNames = columns.map((_, i) => `:b${i}`);
  
  const sql = `INSERT INTO ${tableName.toUpperCase()} (${columns.join(', ')}) VALUES (${bindNames.join(', ')})`;
  
  const binds = {};
  columns.forEach((col, i) => {
    binds[`b${i}`] = row[col];
  });
  
  await connection.execute(sql, binds);
}

/**
 * Update sequence to continue from max ID
 */
async function updateSequence(connection, tableName, data) {
  try {
    const maxId = Math.max(...data.map(r => r.id));
    const seqName = `${tableName.toUpperCase()}_SEQ`;
    
    // Drop and recreate sequence starting from maxId + 1
    try {
      await connection.execute(`DROP SEQUENCE ${seqName}`);
    } catch (e) {
      // Sequence might not exist
    }
    
    await connection.execute(
      `CREATE SEQUENCE ${seqName} START WITH ${maxId + 1} INCREMENT BY 1`
    );
    
    console.log(`   🔢 Updated ${seqName} to start from ${maxId + 1}`);
  } catch (err) {
    console.log(`   ⚠️ Could not update sequence: ${err.message}`);
  }
}

// ============================================
// Verification Functions
// ============================================

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  let connection;
  const results = [];

  try {
    connection = await oracledb.getConnection(ORACLE_CONFIG);

    for (const table of TABLES) {
      try {
        // Count in Supabase
        const { count: supabaseCount, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
        
        // Count in Oracle
        const oracleResult = await connection.execute(
          `SELECT COUNT(*) AS CNT FROM ${table.name.toUpperCase()}`
        );
        const oracleCount = oracleResult.rows[0]?.CNT || 0;
        
        const match = !error && supabaseCount === oracleCount;
        results.push({
          table: table.name,
          supabase: error ? 'error' : supabaseCount,
          oracle: oracleCount,
          match: match ? '✅' : '❌'
        });
      } catch (err) {
        results.push({
          table: table.name,
          supabase: 'error',
          oracle: 'error',
          match: '❌'
        });
      }
    }

  } finally {
    if (connection) {
      await connection.close();
    }
  }

  console.table(results);
  return results;
}

// ============================================
// Main Execution
// ============================================

async function main() {
  const args = process.argv.slice(2);
  
  console.log('═══════════════════════════════════════════');
  console.log('  YARSU Migration: Supabase → Oracle');
  console.log('═══════════════════════════════════════════\n');

  if (args.includes('--export') || args.includes('-e')) {
    await exportFromSupabase();
  } else if (args.includes('--import') || args.includes('-i')) {
    await importToOracle();
  } else if (args.includes('--verify') || args.includes('-v')) {
    await verifyMigration();
  } else if (args.includes('--full') || args.includes('-f')) {
    await exportFromSupabase();
    console.log('\n' + '─'.repeat(50) + '\n');
    await importToOracle();
    console.log('\n' + '─'.repeat(50) + '\n');
    await verifyMigration();
  } else {
    console.log('Usage:');
    console.log('  node scripts/migrate-to-oracle.js --export   Export data from Supabase to JSON files');
    console.log('  node scripts/migrate-to-oracle.js --import   Import data from JSON files to Oracle');
    console.log('  node scripts/migrate-to-oracle.js --verify   Verify row counts match');
    console.log('  node scripts/migrate-to-oracle.js --full     Run full migration (export + import + verify)');
  }
}

main().catch(console.error);
