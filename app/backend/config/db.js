// config/db.js
import { createConnection } from 'mysql2';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

const connection = createConnection({
  host: process.env.DB_HOST || 'localhost',  // Use 'localhost' or '127.0.0.1'
  user: process.env.DB_USER || 'root',       // Ensure this is 'root'
  password: process.env.DB_PASSWORD || 'sk1', // Your root password
  database: process.env.DB_NAME || 'sk1', // Your database name
  port: process.env.DB_PORT || 3304,          // Default MySQL port
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    console.log("connection nhi ho rha");
    return;
  }
  console.log('Connected to database');
});

export default connection;
