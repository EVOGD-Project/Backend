import { Schema, Types, model } from 'mongoose';

export interface IClassroom {
	id: string;
	name: string;
	description: string;
	thumbnailId: number;
	code: string;
	owner: Types.ObjectId;
}

const schema = new Schema<IClassroom>(
	{
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'user',
			required: true,
			index: true
		},
		name: {
			type: String,
			required: true
		},
		description: {
			type: String,
			required: true
		},
		thumbnailId: {
			type: Number,
			required: true
		},
		code: {
			type: String,
			required: true,
			unique: true,
			index: true
		}
	},
	{
		timestamps: true
	}
);

export const ClassroomModel = model<IClassroom>('Classroom', schema);
