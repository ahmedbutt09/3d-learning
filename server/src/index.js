import { initDb } from './db.js';
import { migrate, seed } from './schema.js';
import { createApp } from './app.js';

const port = process.env.PORT || 4000;

await initDb();
await migrate();
await seed();

createApp().listen(port, () => console.log(`3D Learning API listening on port ${port}`));
