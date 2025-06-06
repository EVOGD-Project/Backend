import { Elysia, t } from 'elysia';
import { UserModel } from '../../../models/UserModel';

export const authLoginRoute = new Elysia({
	name: 'routes:authLoginRoute',
	prefix: '/auth/login'
}).post(
	'/',
	async ({ body, status }) => {
		if (!body) return status(400, 'Bad Request');

		const { email, password } = body;

		const user = await UserModel.findOne({ email })
			.lean()
			.exec()
			.catch(() => null);

		if (!user) return status(403, 'Invalid credentials');

		const passwordMatch = await UserModel.verifyPassword(password.trim(), user.password);

		if (!passwordMatch) return status(403, 'Invalid credentials');

		return { token: user.token };
	},
	{
		parse: 'json',
		body: t.Object(
			{
				email: t.String({ minLength: 1, maxLength: 256, format: 'email' }),
				password: t.String({ minLength: 1, maxLength: 256 })
			},
			{
				additionalProperties: false
			}
		)
	}
);
