import { Elysia, t } from 'elysia';
import { ActivityModel } from '../../../models/ActivityModel';
import { ClassroomModel } from '../../../models/ClassroomModel';
import { UserModel } from '../../../models/UserModel';
import { headersPlugin } from '../../../plugins/headers';

export const classroomActivitiesRoute = new Elysia({
	name: 'routes:classroomActivitiesRoute',
	prefix: '/classrooms/:id/activities'
})
	.use(headersPlugin)
	.get(
		'/',
		async ({ params: { id }, status, token }) => {
			const user = await UserModel.findOne({ token })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');
			if (!user.classroomIds?.includes(id)) return status(403, 'Forbidden');

			const activities = await ActivityModel.find({ classroomId: id })
				.lean()
				.exec()
				.catch(() => null);

			if (!activities) return status(400, 'Bad Request');

			return activities;
		},
		{
			params: t.Object({
				id: t.String({ minLength: 1 })
			})
		}
	)
	.post(
		'/',
		async ({ body, params: { id }, status, token }) => {
			if (!body) return status(400, 'Bad Request');

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
			if (classroom.owner !== token) return status(403, 'Forbidden');

			const { title, description, type, content, dueDate } = body;

			const activity = new ActivityModel({
				title,
				description,
				classroomId: id,
				type,
				content,
				dueDate,
				owner: token,
				createdAt: new Date().toISOString()
			});

			const save = await activity.save().catch(() => null);

			if (!save) return status(400, 'Bad Request');

			return { id: save.id };
		},
		{
			parse: 'json',
			params: t.Object({
				id: t.String({ minLength: 1 })
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
			const user = await UserModel.findOne({ token })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');
			if (!user.classroomIds?.includes(classroomId)) return status(403, 'Forbidden');

			const activity = await ActivityModel.findOne({
				_id: activityId,
				classroomId
			})
				.lean()
				.exec()
				.catch(() => null);

			if (!activity) return status(404, 'Activity not found');

			return activity;
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

			const user = await UserModel.findOne({ token })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');
			if (!user.classroomIds?.includes(classroomId)) return status(403, 'Forbidden');

			const activity = await ActivityModel.findOne({
				_id: activityId,
				classroomId
			})
				.exec()
				.catch(() => null);

			if (!activity) return status(404, 'Activity not found');
			if (activity.owner !== token) return status(403, 'Forbidden');

			const { title, description, type, content, dueDate } = body;

			activity.title = title;
			activity.description = description;
			activity.type = type;
			activity.content = content;
			activity.dueDate = dueDate;

			const save = await activity.save().catch(() => null);

			if (!save) return status(400, 'Bad Request');

			return { id: save.id };
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
