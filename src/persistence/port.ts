// PersistencePort — abstraction over storage (tech stack PROPOSED).
// Concrete implementation: Drizzle + pg (src/persistence/repositories.ts).

export interface PersistencePort {
  save(entity: { type: string; id: string; data: Record<string, unknown> }): Promise<void>;
  load(type: string, id: string): Promise<Record<string, unknown> | null>;
  list(type: string, filter?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  delete(type: string, id: string): Promise<void>;
  transaction<T>(fn: (port: PersistencePort) => Promise<T>): Promise<T>;
}