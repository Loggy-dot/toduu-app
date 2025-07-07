const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'toduu.db');
const db = new sqlite3.Database(dbPath);

console.log('=== TODUU DATABASE VIEWER ===\n');

// Function to display table structure
const showTableStructure = (tableName) => {
  return new Promise((resolve) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        console.error(`Error getting ${tableName} structure:`, err);
        resolve();
        return;
      }
      
      console.log(`\n📋 ${tableName.toUpperCase()} TABLE STRUCTURE:`);
      console.log('Column Name | Type | Not Null | Default | Primary Key');
      console.log('------------|------|----------|---------|------------');
      
      rows.forEach(row => {
        console.log(`${row.name.padEnd(11)} | ${row.type.padEnd(4)} | ${row.notnull ? 'YES' : 'NO'} | ${row.dflt_value || 'NULL'} | ${row.pk ? 'YES' : 'NO'}`);
      });
      
      resolve();
    });
  });
};

// Function to display table data
const showTableData = (tableName) => {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) {
        console.error(`Error getting ${tableName} data:`, err);
        resolve();
        return;
      }
      
      console.log(`\n📊 ${tableName.toUpperCase()} TABLE DATA (${rows.length} records):`);
      
      if (rows.length === 0) {
        console.log('No data found in this table.');
      } else {
        console.table(rows);
      }
      
      resolve();
    });
  });
};

// Main function to display all database info
const viewDatabase = async () => {
  try {
    // Get all tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", async (err, tables) => {
      if (err) {
        console.error('Error getting tables:', err);
        return;
      }
      
      console.log('📁 Database Location:', dbPath);
      console.log('🗂️  Available Tables:', tables.map(t => t.name).join(', '));
      
      // Show structure and data for each table
      for (const table of tables) {
        await showTableStructure(table.name);
        await showTableData(table.name);
      }
      
      console.log('\n=== END OF DATABASE VIEW ===');
      db.close();
    });
    
  } catch (error) {
    console.error('Error viewing database:', error);
    db.close();
  }
};

viewDatabase();