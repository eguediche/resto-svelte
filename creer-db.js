import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('tastemap.db');
const sql = fs.readFileSync('db.sql', 'utf8');

db.exec(sql);

const total = db.prepare('SELECT COUNT(*) AS total FROM restaurants').get();
console.log('Restaurants créés :', total.total);