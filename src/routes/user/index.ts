import { Elysia } from 'elysia';
import { minio } from '../..';
import { UserModel } from '../../models/UserModel';
import { headersPlugin } from '../../plugins/headers';
import { generateAvatarId } from '../../util/generateAvatarId';

export const userRoute = new Elysia({
	name: 'routes:userRoute',
	prefix: '/user'
})
	.use(headersPlugin)
	.get(
		'/',
		async ({ status, token }) => {
			const user = await UserModel.findOne(
				{
					token: token
				},
				{ __v: 0 }
			)
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Unauthorized');

			return {
				id: user._id.toString(),
				username: user.username,
				email: user.email,
				avatar: user.avatar,
				classroomIds: user.classroomIds
			};
		},
		{
			parse: 'none'
		}
	)
	.post(
		'/avatar',
		async ({ status, token }) => {
			const user = await UserModel.findOne(
				{
					token: token
				},
				{ __v: 0 }
			)
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Unauthorized');

			const avatarId = generateAvatarId();

			const url = await minio.presignedPutObject(
				'avatars',
				`${user._id.toString()}/${avatarId}.png`,
				1 * 60 * 60
			);

			if (!url) return status(400, 'Error');

			await UserModel.updateOne({ token }, { avatar: avatarId }, { projection: { __v: 0 } })
				.lean()
				.exec();

			await minio.removeObject('avatars', `${user._id.toString()}/${user.avatar}.png`);

			return { url };
		},
		{
			parse: 'none'
		}
	);
