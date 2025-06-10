import { randomBytes } from 'crypto';

export const generateAvatarId = () => randomBytes(16).toString('hex');
