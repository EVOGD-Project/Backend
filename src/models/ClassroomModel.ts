import { Schema, model } from 'mongoose';
import { SchemaUtil } from '../classes/SchemaUtil';

export interface IClassroom {
	id: string;
	name: string;
	description: string;
	thumbnailId: number;
	code: string;
	owner: string;
}

const schema = new Schema<IClassroom>(
	{
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
		},
		owner: {
			type: String,
			required: true,
			index: true
		}
	},
	{
		timestamps: true
	}
);

schema.set('toJSON', {
	transform: SchemaUtil.transformSchemaToJSON
});

export const ClassroomModel = model<IClassroom>('Classroom', schema);
