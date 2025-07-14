import mysql from 'mysql2/promise';

// MySQL configuration
const MYSQL_CONFIG = {
  host: '107.175.179.122',
  user: 'lunara',
  password: 'SbX7s8aMjf7xZX2e',
  database: 'lunara',
  port: 3306,
  ssl: false,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
};

export async function testMySQLConnection(): Promise<void> {
  console.log('🔄 Testing MySQL connection...');
  console.log('📋 Connection config:', {
    host: MYSQL_CONFIG.host,
    user: MYSQL_CONFIG.user,
    database: MYSQL_CONFIG.database,
    port: MYSQL_CONFIG.port
  });

  let connection: mysql.Connection | null = null;

  try {
    // Test basic connection
    console.log('🔌 Attempting to connect...');
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ MySQL connection established successfully!');

    // Test ping
    console.log('🏓 Testing ping...');
    await connection.ping();
    console.log('✅ MySQL ping successful!');

    // Test database access
    console.log('🗄️ Testing database access...');
    const [rows] = await connection.execute('SELECT DATABASE() as current_db, NOW() as current_time');
    console.log('✅ Database access successful:', rows);

    // Check existing tables
    console.log('📋 Checking existing tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Existing tables:', tables);

    // Check if users table exists and has data
    try {
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users') as any;
      console.log('👥 Users in database:', userCount[0].count);
      
      if (userCount[0].count > 0) {
        const [users] = await connection.execute('SELECT id, username, email, role FROM users LIMIT 5');
        console.log('👤 Sample users:', users);
      }
    } catch (error) {
      console.log('⚠️ Users table not found or empty');
    }

  } catch (error: any) {
    console.error('❌ MySQL connection failed:', error);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // Provide troubleshooting tips
    console.log('🔧 Troubleshooting tips:');
    console.log('1. Check if MySQL server is running');
    console.log('2. Verify database credentials');
    console.log('3. Check firewall settings');
    console.log('4. Ensure database "lunara" exists');
    console.log('5. Verify user "lunara" has proper permissions');
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 MySQL connection closed');
    }
  }
}

// Auto-run test when imported
if (typeof window !== 'undefined') {
  // Run in browser
  testMySQLConnection().catch(console.error);
}