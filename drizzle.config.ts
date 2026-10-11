import { defineConfig } from 'drizzle-kit';

export default defineConfig({ schema: './db/migration-schema.ts', out: './drizzle', dialect: 'sqlite' });
