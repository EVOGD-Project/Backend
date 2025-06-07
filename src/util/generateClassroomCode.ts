import { customAlphabet } from 'nanoid';

const CLASSROOM_CODE_LENGTH = 6;
const CLASSROOM_CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const generateClassroomCode = customAlphabet(CLASSROOM_CODE_ALPHABET, CLASSROOM_CODE_LENGTH);
