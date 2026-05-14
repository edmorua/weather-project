import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Boots an in-memory Mongo once for the whole e2e suite, exposes its URI
 * via `process.env.MONGO_URI`, and stashes the instance for teardown.
 */
export default async function globalSetup(): Promise<void> {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.OPENWEATHER_API_KEY = 'test-key';
  process.env.NODE_ENV = 'test';
  (globalThis as unknown as { __MONGOD__: MongoMemoryServer }).__MONGOD__ = mongod;
}
