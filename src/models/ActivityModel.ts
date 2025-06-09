import { Schema, Types, model } from 'mongoose';

export interface IActivity {
	id: string;
	title: string;
	description: string;
	classroomId: string;
	owner: Types.ObjectId;
	dueDate?: string;
	createdAt: string;
	type: 'assignment' | 'material';
	content: {
		instructions?: string;
		resources?: Array<{
			type: 'link' | 'file';
			name: string;
			url: string;
		}>;
	};
}

const resourceSchema = new Schema(
	{
		type: {
			type: String,
			enum: ['link', 'file'],
			required: true
		},
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

const activitySchema = new Schema<IActivity>(
	{
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'user',
			required: true,
			index: true
		},
		title: {
			type: String,
			required: true
		},
		description: {
			type: String,
			required: true
		},
		classroomId: {
			type: String,
			required: true
		},
		dueDate: {
			type: String,
			required: false
		},
		type: {
			type: String,
			enum: ['assignment', 'material'],
			required: true
		},
		content: {
			instructions: {
				type: String,
				required: false
			},
			resources: {
				type: [resourceSchema],
				required: false,
				default: []
			}
		}
	},
	{
		timestamps: true
	}
);

export const ActivityModel = model<IActivity>('Activity', activitySchema);
