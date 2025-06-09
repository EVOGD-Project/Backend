import { Elysia, t } from 'elysia';
import { ActivityModel } from '../../../models/ActivityModel';
import { ClassroomModel } from '../../../models/ClassroomModel';
import { UserModel } from '../../../models/UserModel';
import { headersPlugin } from '../../../plugins/headers';

export const classroomActivitiesRoute = new Elysia({
	name: 'routes:classroomActivitiesRoute',
	prefix: '/classrooms/:classroomId/activities'
})
	.use(headersPlugin)
	.get(
		'/',
		async ({ params: { classroomId }, status, token }) => {
			const user = await UserModel.findOne({ token }, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');
			if (!user.classroomIds?.some((cId) => cId.toString() === classroomId)) return status(403, 'Forbidden');

			const activities = await ActivityModel.find({ classroom: classroomId }, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!activities) return status(400, 'Bad Request');

			return activities.map((activity) => ({
				...activity,
				id: activity._id.toString(),
				content: { ...activity.content, instructions: undefined },
				_id: undefined
			}));
		},
		{
			params: t.Object({
				classroomId: t.String({ minLength: 1 })
			})
		}
	)
	.post(
		'/',
		async ({ body, params: { classroomId }, status, token }) => {
			if (!body) return status(400, 'Bad Request');

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
			if (classroom.owner.toString() !== user._id.toString()) return status(403, 'Forbidden');

			const { title, description, type, content, dueDate } = body;

			const activity = new ActivityModel({
				title,
				description,
				classroom: classroomId,
				type,
				content,
				dueDate,
				owner: user._id,
				createdAt: new Date().toISOString()
			});

			const save = await activity.save().catch(() => null);

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
					title: t.String({ minLength: 1, maxLength: 256 }),
					description: t.String({ minLength: 1, maxLength: 1024 }),
					type: t.Union([t.Literal('assignment'), t.Literal('material')]),
					dueDate: t.Optional(t.String()),
					content: t.Object({
						instructions: t.Optional(t.String()),
						resources: t.Optional(
							t.Array(
								t.Object({
									type: t.Union([t.Literal('link'), t.Literal('file')]),
									name: t.String({ minLength: 1 }),
									url: t.String({ minLength: 1 })
								})
							)
						)
					})
				},
				{
					additionalProperties: false
				}
			)
		}
	)
	.get(
		'/:activityId',
		async ({ params: { classroomId, activityId }, status, token }) => {
			const user = await UserModel.findOne({ token }, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');
			if (!user.classroomIds?.some((cId) => cId.toString() === classroomId)) return status(403, 'Forbidden');

			const activity = await ActivityModel.findOne(
				{
					_id: activityId,
					classroom: classroomId
				},
				{ __v: 0 }
			)
				.lean()
				.exec()
				.catch(() => null);

			if (!activity) return status(404, 'Activity not found');

			return {
				...activity,
				id: activity._id.toString(),
				_id: undefined
			};
		},
		{
			params: t.Object({
				classroomId: t.String({ minLength: 1 }),
				activityId: t.String({ minLength: 1 })
			})
		}
	)
	.put(
		'/:activityId',
		async ({ body, params: { classroomId, activityId }, status, token }) => {
			if (!body) return status(400, 'Bad Request');

			const user = await UserModel.findOne({ token }, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');
			if (!user.classroomIds?.some((cId) => cId.toString() === classroomId)) return status(403, 'Forbidden');

			const activity = await ActivityModel.findOne(
				{
					_id: activityId,
					classroom: classroomId
				},
				{ __v: 0 }
			)
				.exec()
				.catch(() => null);

			if (!activity) return status(404, 'Activity not found');
			if (activity.owner.toString() !== user._id.toString()) return status(403, 'Forbidden');

			const { title, description, type, content, dueDate } = body;

			activity.title = title;
			activity.description = description;
			activity.type = type;
			activity.content = content;
			activity.dueDate = dueDate;

			const save = await activity.save().catch(() => null);

			if (!save) return status(400, 'Bad Request');

			return { id: save._id.toString() };
		},
		{
			parse: 'json',
			params: t.Object({
				classroomId: t.String({ minLength: 1 }),
				activityId: t.String({ minLength: 1 })
			}),
			body: t.Object(
				{
					title: t.String({ minLength: 1, maxLength: 256 }),
					description: t.String({ minLength: 1, maxLength: 1024 }),
					type: t.Union([t.Literal('assignment'), t.Literal('material')]),
					dueDate: t.Optional(t.String()),
					content: t.Object({
						instructions: t.Optional(t.String()),
						resources: t.Optional(
							t.Array(
								t.Object({
									type: t.Union([t.Literal('link'), t.Literal('file')]),
									name: t.String({ minLength: 1 }),
									url: t.String({ minLength: 1 })
								})
							)
						)
					})
				},
				{
					additionalProperties: false
				}
			)
		}
	);
