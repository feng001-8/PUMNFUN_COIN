export declare class MockDatabase {
    private data;
    constructor();
    exec(sql: string): this;
    prepare(sql: string): {
        run: (...args: any[]) => {
            changes: number;
            lastInsertRowid: number;
        };
        all: (...args: any[]) => never[];
        get: (...args: any[]) => null;
    };
    close(): void;
}
export declare class DatabaseManager {
    private db;
    constructor(dbPath?: string);
    private init;
    close(): void;
    getDb(): MockDatabase;
}
export { DatabaseManager as Database };
