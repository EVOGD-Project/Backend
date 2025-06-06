import Elysia from 'elysia';

export const headersPlugin = new Elysia({ name: 'plugins:headers' }).derive(
	{ as: 'global' },
	({ request: { headers } }) => {
		let token = headers.get('Authorization');

		if (!token || typeof token !== 'string') token = '';

		let ip = headers.get('CF-Connecting-IP') ?? headers.get('X-Forwarded-For');

		if (!ip) ip = '';

		return {
			token,
			ip
		};
	}
);
