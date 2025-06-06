import { DatabaseClient } from './classes/DatabaseClient';
import { MainServer } from './classes/MainServer';

const db = new DatabaseClient();

const mainServer = new MainServer();

mainServer.setup();

mainServer.listen();

db.connect(process.env['MONGODB_URI'] ?? '');
