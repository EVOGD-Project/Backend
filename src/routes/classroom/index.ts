import { Elysia, t } from 'elysia';
import { ClassroomModel } from '../../models/ClassroomModel';
import { UserModel } from '../../models/UserModel';
import { headersPlugin } from '../../plugins/headers';
import { generateClassroomCode } from '../../util/generateClassroomCode';

export const classroomRoute = new Elysia({
	name: 'routes:classroomRoute',
	prefix: '/classroom'
})
	.use(headersPlugin)
	.post(
		'/',
		async ({ body, status, token }) => {
			if (!body) return status(400, 'Bad Request');

			const { name, description, thumbnailId } = body;

			const code = generateClassroomCode();

			const classroom = new ClassroomModel({
				name,
				description,
				thumbnailId,
				code,
				owner: token
			});

			const save = await classroom.save().catch(() => null);

			if (!save) return status(400, 'Bad Request');

			await UserModel.findOneAndUpdate({ token }, { $addToSet: { classroomIds: save._id.toString() } }).exec();

			return save;
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
		'/join/:code',
		async ({ params: { code }, status, token }) => {
			const classroom = await ClassroomModel.findOne({ code })
				.lean()
				.exec()
				.catch(() => null);

			if (!classroom) return status(404, 'Classroom not found');

			await UserModel.findOneAndUpdate(
				{ token },
				{ $addToSet: { classroomIds: classroom._id.toString() } }
			).exec();

			return classroom;
		},
		{
			params: t.Object({
				code: t.String({ minLength: 1 })
			})
		}
	)
	.get('/', async ({ status, token }) => {
		const user = await UserModel.findOne({ token })
			.lean()
			.exec()
			.catch(() => null);

		if (!user) return status(400, 'Bad Request');

		const classrooms = await ClassroomModel.find({
			_id: { $in: user.classroomIds }
		})
			.lean()
			.exec()
			.catch(() => null);

		if (!classrooms) return status(400, 'Bad Request');

		return classrooms;
	})
	.get(
		'/:id',
		async ({ params: { id }, status, token }) => {
			const user = await UserModel.findOne({ token })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');
			if (!user.classroomIds?.includes(id)) return status(403, 'Forbidden');

			const classroom = await ClassroomModel.findById(id)
				.lean()
				.exec()
				.catch(() => null);

			if (!classroom) return status(404, 'Classroom not found');

			return classroom;
		},
		{
			params: t.Object({
				id: t.String({ minLength: 1 })
			})
		}
	)
	.put(
		'/:id',
		async ({ body, params: { id }, status, token }) => {
			if (!body) return status(400, 'Bad Request');

			const classroom = await ClassroomModel.findById(id)
				.exec()
				.catch(() => null);

			if (!classroom) return status(404, 'Classroom not found');
			if (classroom.owner !== token) return status(403, 'Forbidden');

			const { name, description, thumbnailId } = body;

			classroom.name = name;
			classroom.description = description;
			classroom.thumbnailId = thumbnailId;

			const save = await classroom.save().catch(() => null);

			if (!save) return status(400, 'Bad Request');

			return save;
		},
		{
			parse: 'json',
			params: t.Object({
				id: t.String({ minLength: 1 })
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
	);
