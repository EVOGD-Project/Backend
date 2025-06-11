import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import swagger from '@elysiajs/swagger';
import Elysia from 'elysia';
import { register } from 'prom-client';
import { metricsPlugin } from '../plugins/metricsPlugin';
import { authLoginRoute } from '../routes/auth/login';
import { authRegisterRoute } from '../routes/auth/register';
import { classroomsRoute } from '../routes/classroom';
import { classroomActivitiesRoute } from '../routes/classroom/activities';
import { classroomActivitySubmissionsRoute } from '../routes/classroom/activities/submissions';
import { userRoute } from '../routes/user';

const metricsToken = process.env['METRICS_TOKEN']?.replace('=', '');;

export class MainServer {
	app: Elysia;
	port: number;

	constructor() {
		this.app = new Elysia();
		this.port = parseInt(process.env['PORT'] ?? '4000');
	}

	public setup() {
		this.app
			.use(cors())
			.use(staticPlugin())
			.use(metricsPlugin)
			.use(authLoginRoute)
			.use(authRegisterRoute)
			.use(userRoute)
			.use(classroomsRoute)
			.use(classroomActivitiesRoute)
			.use(classroomActivitySubmissionsRoute)
			.get('/metrics', async ({ request, status }) => {
				const auth = request.headers.get('authorization')?.replace('=', '');
				const expected = 'Basic ' + metricsToken;

				if (auth !== expected) return status(400);

				return new Response(await register.metrics(), {
					headers: { 'Content-Type': register.contentType }
				});
			});

		if (process.env['ENABLE_SWAGGER'] === 'true') {
			console.log('Swagger enabled.');

			this.app.use(
				swagger({
					documentation: {
						info: {
							version: 'latest',
							title: 'EVOGD Backend Docs',
							description: 'EVOGD Backend Documentation'
						}
					},
					swaggerOptions: {
						syntaxHighlight: { activate: true, theme: 'monokai' }
					},
					path: '/docs',
					exclude: /\/docs/,
					scalarCDN: '/public/scalar.min.js',
					scalarConfig: {
						servers: [
							{
								description: 'EvoGD API',
								url: 'https://evogd-api.tnfangel.com'
							}
						]
					}
				})
			);
		}

		console.log('EVOGD Backend started.');
	}

	public listen() {
		this.app.listen({ port: this.port, idleTimeout: 20 }, () => {
			console.log('Listening on port', `http://localhost:${this.port}`);
		});
	}
}
