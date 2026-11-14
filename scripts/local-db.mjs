import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
export function localDB(filename=':memory:'){
 const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA foreign_keys=ON');
 sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort()){
  if(sqlite.prepare('SELECT name FROM local_migrations WHERE name=?').get(file))continue;
  sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));sqlite.prepare('INSERT INTO local_migrations(name) VALUES (?)').run(file);
 }
 const db={prepare(sql){let values=[];return {bind(...v){values=v;return this},async first(){return sqlite.prepare(sql).get(...values)||null},async all(){return {results:sqlite.prepare(sql).all(...values)}},async run(){const r=sqlite.prepare(sql).run(...values);return {success:true,meta:{changes:r.changes}}}}},async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}},close(){sqlite.close()}};
 return db;
}
