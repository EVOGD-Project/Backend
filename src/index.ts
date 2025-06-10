import { Client as MinIOClient } from 'minio';
import { DatabaseClient } from './classes/DatabaseClient';
import { MainServer } from './classes/MainServer';
const db = new DatabaseClient();

const mainServer = new MainServer();

mainServer.setup();

mainServer.listen();

db.connect(process.env['MONGODB_URI'] ?? '');

export const minio = new MinIOClient({
	endPoint: process.env['MINIO_ENDPOINT'] ?? '',
	port: process.env['MINIO_PORT'] ? parseInt(process.env['MINIO_PORT'] ?? '') : undefined,
	useSSL: process.env['MINIO_USE_SSL'] ? process.env['MINIO_USE_SSL'] === 'true' : true,
	accessKey: process.env['MINIO_USER'] ?? '',
	secretKey: process.env['MINIO_PASSWORD'] ?? ''
});
