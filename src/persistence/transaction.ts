// Transaction wrapper for WP1-A command execution (Drizzle + pg).
// Uses Drizzle's db.transaction() so domain writes are atomic.

import type { Db } from "./db.js";

export type TransactionalDb = Db;

export interface TransactionManager {
  run<T>(fn: (tx: TransactionalDb) => Promise<T>): Promise<T>;
}

export class DrizzleTransactionManager implements TransactionManager {
  constructor(private readonly db: Db) {}

  async run<T>(fn: (tx: TransactionalDb) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => fn(tx as unknown as TransactionalDb));
  }
}

export async function runInTransaction<T>(
  db: Db,
  fn: (tx: TransactionalDb) => Promise<T>
): Promise<T> {
  return new DrizzleTransactionManager(db).run(fn);
}

export const withTransaction = runInTransaction;
export const runTransaction = runInTransaction;
export const inTransaction = runInTransaction;

export function createTransactionManager(db: Db): TransactionManager {
  return new DrizzleTransactionManager(db);
}