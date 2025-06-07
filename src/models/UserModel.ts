import { Schema, model } from 'mongoose';
import { SchemaUtil } from '../classes/SchemaUtil';

const schema = new Schema(
	{
		token: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		username: { type: String, required: true, trim: true },
		email: {
			type: String,
			index: true,
			required: true,
			unique: true,
			trim: true
		},
		password: { type: String, required: true },
		avatar: { type: String, required: false, trim: true },
		classroomIds: {
			type: [String],
			required: false,
			default: []
		}
	},
	{
		statics: {
			async verifyPassword(password: string, hash: string) {
				return Bun.password.verify(password, hash);
			}
		}
	}
);

schema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();

	try {
		this.password = await Bun.password.hash(this.password, {
			algorithm:
				(process.env['SAVE_ACCOUNT_ALGORITHM'] as 'bcrypt' | 'argon2id' | 'argon2d' | 'argon2i' | undefined) ||
				'argon2id',
			timeCost: parseInt(process.env['SAVE_ACCOUNT_TIME_COST'] || '3'),
			cost: parseInt(process.env['SAVE_ACCOUNT_ALGORITHM_COST'] || '12')
		});

		return next();
	} catch (err: any) {
		return next(err);
	}
});

schema.set('toJSON', {
	transform: SchemaUtil.transformSchemaToJSON
});

export const UserModel = model('user', schema);
