/**
 * Overwriting Dexie Module to support keyNames in queries
 */
/* eslint-disable @typescript-eslint/ban-types */

import { ThenShortcut } from 'dexie';

declare module 'Dexie' {
    /**
     * !! Explanation for adding ts-ignore !!
     *
     * Typescript expects all declarations of 'Table' must have identical type parameters.
     * but the whole point is that we want to overwrite the type parameters for this method
     * where()
     *
     * This method is modified from
     * * where(equalityCriteria: { [key: string]: any;}): Collection<T, TKey>;
     * to
     * * where(equalityCriteria: Partial<Record<keyof T, any>>): Collection<T, TKey>;
     *
     * More methods should be modified to bring in suggestions
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    export interface Table<T = Record<string, unknown>, TKey = IndexableType> {
        db: Database;
        name: string;
        schema: TableSchema;
        hook: TableHooks<T, TKey>;
        core: DBCoreTable;
        get(key: string): PromiseExtended<T | undefined>;
        get<R>(
            key: TKey,
            thenShortcut: ThenShortcut<T | undefined, R>
        ): PromiseExtended<R>;
        get(equalityCriterias: {
            [key: string]: unknown;
        }): PromiseExtended<T | undefined>;
        get<R>(
            equalityCriteria: {
                [key: string]: unknown;
            },
            thenShortcut: ThenShortcut<T | undefined, R>
        ): PromiseExtended<R>;
        where(index: string | string[]): WhereClause<T, TKey>;
        where(
            equalityCriteria: Partial<Record<keyof T, unknown>>
        ): Collection<T, TKey>;
        filter(fn: (obj: T) => boolean): Collection<T, TKey>;
        count(): PromiseExtended<number>;
        count<R>(thenShortcut: ThenShortcut<number, R>): PromiseExtended<R>;
        offset(n: number): Collection<T, TKey>;
        limit(n: number): Collection<T, TKey>;
        each(
            callback: (
                obj: T,
                cursor: {
                    key: unknown;
                    primaryKey: TKey;
                }
            ) => unknown
        ): PromiseExtended<void>;
        toArray(): PromiseExtended<Array<T>>;
        toArray<R>(thenShortcut: ThenShortcut<T[], R>): PromiseExtended<R>;
        toCollection(): Collection<T, TKey>;
        orderBy(index: string | string[]): Collection<T, TKey>;
        reverse(): Collection<T, TKey>;
        mapToClass(constructor: Function): Function;
        add(item: T, key?: TKey): PromiseExtended<TKey>;
        update(
            key: TKey | T,
            changes: {
                [keyPath: string]: unknown;
            }
        ): PromiseExtended<number>;
        put(item: T, key?: TKey): PromiseExtended<TKey>;
        delete(key: TKey): PromiseExtended<void>;
        clear(): PromiseExtended<void>;
        bulkGet(keys: TKey[]): PromiseExtended<(T | undefined)[]>;
        bulkAdd<B extends boolean>(
            items: readonly T[],
            keys: IndexableTypeArrayReadonly,
            options: {
                allKeys: B;
            }
        ): PromiseExtended<B extends true ? TKey[] : TKey>;
        bulkAdd<B extends boolean>(
            items: readonly T[],
            options: {
                allKeys: B;
            }
        ): PromiseExtended<B extends true ? TKey[] : TKey>;
        bulkAdd(
            items: readonly T[],
            keys?: IndexableTypeArrayReadonly,
            options?: {
                allKeys: boolean;
            }
        ): PromiseExtended<TKey>;
        bulkPut<B extends boolean>(
            items: readonly T[],
            keys: IndexableTypeArrayReadonly,
            options: {
                allKeys: B;
            }
        ): PromiseExtended<B extends true ? TKey[] : TKey>;
        bulkPut<B extends boolean>(
            items: readonly T[],
            options: {
                allKeys: B;
            }
        ): PromiseExtended<B extends true ? TKey[] : TKey>;
        bulkPut(
            items: readonly T[],
            keys?: IndexableTypeArrayReadonly,
            options?: {
                allKeys: boolean;
            }
        ): PromiseExtended<TKey>;
        bulkDelete(keys: TKey[]): PromiseExtended<void>;
    }
}
