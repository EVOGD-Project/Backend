import { randomBytes } from 'crypto';

export const generateUserToken = () => randomBytes(32).toString('hex');
