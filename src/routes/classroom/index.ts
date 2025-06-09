import { Elysia, t } from 'elysia';
import { ClassroomModel } from '../../models/ClassroomModel';
import { UserModel } from '../../models/UserModel';
import { headersPlugin } from '../../plugins/headers';
import { generateClassroomCode } from '../../util/generateClassroomCode';

export const classroomsRoute = new Elysia({
	name: 'routes:classroomRoute',
	prefix: '/classrooms'
})
	.use(headersPlugin)
	.get('/', async ({ status, token }) => {
		const user = await UserModel.findOne({ token }, { __v: 0 })
			.lean()
			.exec()
			.catch(() => null);

		if (!user) return status(400, 'Bad Request');

		const classrooms = await ClassroomModel.find(
			{
				_id: { $in: user.classroomIds }
			},
			{ __v: 0 }
		)
			.lean()
			.exec()
			.catch(() => null);

		if (!classrooms) return status(400, 'Bad Request');

		return classrooms.map((classroom) => ({
			...classroom,
			id: classroom._id.toString(),
			_id: undefined
		}));
	})
	.post(
		'/',
		async ({ body, status, token }) => {
			if (!body) return status(400, 'Bad Request');

			const { name, description, thumbnailId } = body;

			const user = await UserModel.findOne({ token }, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');

			const code = generateClassroomCode();

			const classroom = new ClassroomModel({
				name,
				description,
				thumbnailId,
				code,
				owner: user._id
			});

			const save = await classroom.save().catch(() => null);

			if (!save) return status(400, 'Bad Request');

			await UserModel.updateOne({ token }, { $addToSet: { classroomIds: save._id } })
				.lean()
				.exec();

			return { id: save._id.toString() };
		},
		{
			parse: 'json',
			body: t.Object(
				{
					name: t.String({ minLength: 1, maxLength: 256 }),
					description: t.String({ minLength: 1, maxLength: 1024 }),
					thumbnailId: t.Number({ minimum: 0, maximum: 9 })
				},
				{
					additionalProperties: false
				}
			)
		}
	)
	.get(
		'/:classroomId',
		async ({ params: { classroomId }, status, token }) => {
			const user = await UserModel.findOne({ token }, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');
			if (!user.classroomIds?.some((cId) => cId.toString() === classroomId)) return status(403, 'Forbidden');

			const classroom = await ClassroomModel.findById(classroomId, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!classroom) return status(404, 'Classroom not found');

			return {
				...classroom,
				id: classroom._id.toString(),
				_id: undefined
			};
		},
		{
			params: t.Object({
				classroomId: t.String({ minLength: 1 })
			})
		}
	)
	.put(
		'/:classroomId',
		async ({ body, params: { classroomId }, status, token }) => {
			if (!body) return status(400, 'Bad Request');

			const user = await UserModel.findOne({ token }, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');

			const classroom = await ClassroomModel.findById(classroomId, { __v: 0 })
				.exec()
				.catch(() => null);

			if (!classroom) return status(404, 'Classroom not found');
			if (classroom.owner.toString() !== user._id.toString()) return status(403, 'Forbidden');

			const { name, description, thumbnailId } = body;

			classroom.name = name;
			classroom.description = description;
			classroom.thumbnailId = thumbnailId;

			const save = await classroom.save().catch(() => null);

			if (!save) return status(400, 'Bad Request');

			return { id: save._id.toString() };
		},
		{
			parse: 'json',
			params: t.Object({
				classroomId: t.String({ minLength: 1 })
			}),
			body: t.Object(
				{
					name: t.String({ minLength: 1, maxLength: 256 }),
					description: t.String({ minLength: 1, maxLength: 1024 }),
					thumbnailId: t.Number({ minimum: 0, maximum: 9 })
				},
				{
					additionalProperties: false
				}
			)
		}
	)
	.post(
		'/join/:code',
		async ({ params: { code }, status, token }) => {
			const user = await UserModel.findOne({ token }, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');

			const classroom = await ClassroomModel.findOne({ code }, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!classroom) return status(404, 'Classroom not found');

			if (user.classroomIds?.some((cId) => cId.toString() === classroom._id.toString()))
				return status(403, 'Forbidden');

			await UserModel.updateOne(
				{ token },
				{ $addToSet: { classroomIds: classroom._id } },
				{ projection: { __v: 0 } }
			)
				.lean()
				.exec();

			return {
				...classroom,
				id: classroom._id.toString(),
				_id: undefined
			};
		},
		{
			params: t.Object({
				code: t.String({ minLength: 1, maxLength: 16 })
			})
		}
	);
