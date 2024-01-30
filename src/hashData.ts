import { createHash } from 'crypto';
import type { HonoSessionData } from './session';

export function hashData<T extends HonoSessionData>(data: T) {
	return createHash('sha1').update(JSON.stringify(data)).digest('hex');
}
