import { AppDataSource } from './data-source';

async function runMigrations() {
  const dataSource = await AppDataSource.initialize();
  const executed = await dataSource.runMigrations();
  console.log(`Migrations executed: ${executed.length}`);
  await dataSource.destroy();
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
