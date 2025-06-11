import { Elysia, t } from 'elysia';
import { minio } from '../../../..';
import { ActivityModel } from '../../../../models/ActivityModel';
import { SubmissionModel } from '../../../../models/SubmissionModel';
import { UserModel } from '../../../../models/UserModel';
import { headersPlugin } from '../../../../plugins/headers';

export const classroomActivitySubmissionsRoute = new Elysia({
	name: 'routes:classroomActivitySubmissionsRoute',
	prefix: '/classrooms/:classroomId/activities/:activityId/submissions'
})
	.use(headersPlugin)
	.get(
		'/',
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

			const submission = await SubmissionModel.findOne(
				{
					activity: activityId,
					user: user._id
				},
				{ __v: 0 }
			)
				.lean()
				.exec()
				.catch(() => null);

			if (!submission) return status(400, 'Bad Request');

			return {
				...submission,
				id: submission._id.toString(),
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
	.get(
		'/all',
		async ({ params: { classroomId, activityId }, status, token }) => {
			const user = await UserModel.findOne({ token }, { __v: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!user) return status(400, 'Bad Request');

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

			if (user._id.toString() !== activity.owner.toString()) return status(403, 'Forbidden');

			const submissions = await SubmissionModel.find(
				{
					activity: activityId
				},
				{ __v: 0 }
			)
				.populate('user', { __v: 0, token: 0 })
				.lean()
				.exec()
				.catch(() => null);

			if (!submissions) return status(400, 'Bad Request');

			return submissions.map((submission) => ({
				...submission,
				id: submission._id.toString(),
				_id: undefined,
				user: {
					...submission.user,
					id: submission.user._id.toString(),
					_id: undefined
				}
			}));
		},
		{
			params: t.Object({
				classroomId: t.String({ minLength: 1 }),
				activityId: t.String({ minLength: 1 })
			})
		}
	)
	.post(
		'/',
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
				.lean()
				.exec()
				.catch(() => null);

			if (!activity) return status(404, 'Activity not found');

			const { filename, comment } = body;

			const url = await minio.presignedPutObject(
				'submissions',
				`${user._id.toString()}/${activityId}/${filename}`,
				1 * 60 * 60
			);

			if (!url) return status(400, 'Error');

			let submission = await SubmissionModel.findOne(
				{
					activity: activityId,
					user: user._id
				},
				{ __v: 0 }
			)
				.exec()
				.catch(() => null);

			if (!submission) {
				submission = new SubmissionModel({
					activity: activityId,
					user: user._id,
					files: [],
					comment: comment,
					submittedAt: new Date().toISOString()
				});
			}

			submission.files.push({
				name: filename,
				url: `${user._id.toString()}/${activityId}/${filename}`
			});

			if (comment !== undefined) {
				submission.comment = comment;
			}

			const save = await submission.save().catch(() => null);

			if (!save) return status(400, 'Bad Request');

			return { url };
		},
		{
			parse: 'json',
			params: t.Object({
				classroomId: t.String({ minLength: 1 }),
				activityId: t.String({ minLength: 1 })
			}),
			body: t.Object(
				{
					filename: t.String({ minLength: 1 }),
					comment: t.Optional(t.String({ minLength: 1 }))
				},
				{
					additionalProperties: false
				}
			)
		}
	);
