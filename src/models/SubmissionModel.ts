import { Schema, Types, model } from 'mongoose';

export interface ISubmission {
	id: string;
	activity: Types.ObjectId;
	user: Types.ObjectId;
	files: Array<{
		name: string;
		url: string;
	}>;
	submittedAt: string;
	comment?: string;
}

const fileSchema = new Schema(
	{
		name: {
			type: String,
			required: true
		},
		url: {
			type: String,
			required: true
		}
	},
	{ _id: false }
);

const submissionSchema = new Schema<ISubmission>(
	{
		activity: {
			type: Schema.Types.ObjectId,
			ref: 'activity',
			required: true,
			index: true
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'user',
			required: true,
			index: true
		},
		files: {
			type: [fileSchema],
			required: true,
			default: []
		},
		submittedAt: {
			type: String,
			required: true
		},
		comment: {
			type: String,
			required: false
		}
	},
	{
		timestamps: true
	}
);

export const SubmissionModel = model<ISubmission>('Submission', submissionSchema);
