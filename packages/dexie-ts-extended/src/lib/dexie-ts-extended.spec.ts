import { Table } from 'dexie';
import { ExtendedDexie, database } from './dexie-ts-extended';
import { DatabaseChangeType } from 'dexie-observable/api';

describe('database function', () => {
    type Tables = {
        users: {
            id: string;
            name: string;
        };
    };

    let db: ExtendedDexie<keyof Tables, Tables>;

    beforeAll(async () => {
        db = database<keyof Tables, Tables>({
            databaseName: 'testDB',
            databaseVersion: 1,
            tables: [
                {
                    tableName: 'users',
                    primaryKeyIndex: 'id',
                    indexes: ['name'],
                },
            ],
        });
    });

    afterAll(() => {
        db.closeDatabase();
    });

    it('should open the database with the correct name and version', async () => {
        expect(db.dexie().name).toBe('testDB');
        expect(db.dexie().verno).toBe(1);
    });

    it('should have the correct tables and indexes', async () => {
        const usersTable: Table = db.getTable('users');
        expect(usersTable.schema.primKey.name).toBe('id');
        expect(usersTable.schema.indexes).toEqual(['name']);
    });

    it('should be able to retrieve a table from the database', async () => {
        const usersTable: Table = db.getTable('users');
        expect(usersTable).toBeDefined();
    });

    it('subscribe to changes in the table and print', async () => {
        const changesOnUsers = db.onChanges('users');
        changesOnUsers.subscribe((changeObject) => {
            if (changeObject.type === DatabaseChangeType.Update)
                expect(changeObject.obj.users).toBeDefined();
        });
    });

    it('should throw an error if the database is not open', async () => {
        db.closeDatabase();
        expect(() => db.getTable('users')).toThrowError(
            'Database testDB is not open.'
        );
    });

    it('should throw an error if the database is already closed', async () => {
        db.closeDatabase();
        expect(() => db.closeDatabase()).toThrowError(
            'Database is already closed.'
        );
    });
});
