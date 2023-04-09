import Dexie, { IndexableType, Table } from 'dexie';

export function database<
  TableName extends string = string,
  Shape extends {
    [key in TableName]: {
      [key: string]: IndexableType;
    };
  } = {
    [Key in TableName]: { [key: string]: IndexableType };
  }
>(config: {
  databaseName: string;
  databaseVersion: number;
  tables: {
    tableName: TableName;
    primaryKeyIndex?: string;
    indexes?: IndexableType[];
  }[];
}) {
  const db = new Dexie(config.databaseName);

  async function start(): Promise<void> {
    db.version(config.databaseVersion).stores(
      config.tables
        .map((v) => {
          const obj: { [key: string]: string } = {};
          obj[v.tableName] = [
            v.primaryKeyIndex ?? '++id',
            ...(v.indexes ?? []),
          ].join(',');
          return obj;
        })
        .reduce((pv, cv) => {
          return {
            ...pv,
            ...cv,
          };
        }, {})
    );

    await db.open().catch((e) => {
      console.error(
        `Unable to open database : ${config.databaseName} with error ${e.message}`
      );
      console.error(e);
    });
  }

  function getDatabase(): Dexie {
    return db;
  }

  function getTable<T extends TableName>(
    tableName: T
  ): Table<Shape[T], keyof Shape[T]> {
    if (!db.isOpen())
      throw new Error(`Database ${config.databaseName} is not open.`);
    return db.table<Shape[T], keyof Shape[T]>(tableName);
  }

  function closeDatabase() {
    if (db.isOpen()) db.close();
    else throw new Error(`Database is already closed.`);
  }

  function dexie(): Dexie {
    return db;
  }

  return {
    start,
    getDatabase,
    getTable,
    closeDatabase,
    dexie,
  };
}

export type ExtendedDexie<
  TableName extends string = string,
  Shape extends {
    [key in TableName]: {
      [key: string]: IndexableType;
    };
  } = {
    [Key in TableName]: { [key: string]: IndexableType };
  }
> = ReturnType<typeof database<TableName, Shape>>;
