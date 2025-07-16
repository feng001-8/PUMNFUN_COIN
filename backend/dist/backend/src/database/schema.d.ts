import { type Database as BetterSqlite3Database } from 'better-sqlite3';
export declare class DatabaseManager {
    private db;
    constructor(dbPath?: string);
    private init;
    close(): void;
    getDb(): BetterSqlite3Database;
}
export { DatabaseManager as Database };
