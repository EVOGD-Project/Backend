import { Elysia, t } from 'elysia';
import { UserModel } from '../../../models/UserModel';
import { generateUserToken } from '../../../util/generateUserToken';

export const authRegisterRoute = new Elysia({
	name: 'routes:authRegisterRoute',
	prefix: '/auth/register'
}).post(
	'/',
	async ({ body, status }) => {
		if (!body) return status(400, 'Bad Request');

		const { email, password, username } = body;

		const token = generateUserToken();

		const um = new UserModel({
			username,
			email,
			password,
			token
		});

		const save = await um.save().catch(() => null);

		if (!save) return status(400, 'Bad Request');

		return { token };
	},
	{
		parse: 'json',
		body: t.Object(
			{
				username: t.String({ minLength: 1, maxLength: 256 }),
				email: t.String({ minLength: 1, maxLength: 256, format: 'email' }),
				password: t.String({ minLength: 1, maxLength: 256 })
			},
			{
				additionalProperties: false
			}
		)
	}
);
