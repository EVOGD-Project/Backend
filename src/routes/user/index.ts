import { Elysia } from 'elysia';
import { UserModel } from '../../models/UserModel';
import { headersPlugin } from '../../plugins/headers';

export const userRoute = new Elysia({
	name: 'routes:userRoute',
	prefix: '/user'
})
	.use(headersPlugin)
	.get(
		'/',
		async ({ status, token }) => {
			const user = await UserModel.findOne({
				token: token
			})
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Unauthorized');

			return {
				id: user._id.toString(),
				username: user.username,
				email: user.email,
				avatarURL: user.avatarURL
			};
		},
		{
			parse: 'none'
		}
	);
