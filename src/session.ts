import type { MiddlewareHandler } from 'hono';
import type { CookieOptions } from 'hono/utils/cookie';
import { deleteSession } from './deleteSession';
import { getSession } from './getSession';
import { hashData } from './hashData';
import { saveSession } from './saveSession';
import { MemoryStore } from './store/MemoryStore';
import { touchSession } from './touchSession';


export interface SessionStore<T> {
	get: (sid: string) => Promise<T | undefined>;
	set: (sid: string, data: T) => Promise<void>;
	delete: (sid: string) => Promise<void>;
	touch: (sid: string) => Promise<void>;
}

type JSONValue = string | number | boolean | undefined | null | { [x: string]: JSONValue } | JSONValue[];

export type HonoSessionData = Record<string, JSONValue>;

export type HonoSession<T extends HonoSessionData = HonoSessionData> = {
	data: T;
	id?: string;
	clear: () => void;
};

export type HonoSessionEnv<T extends HonoSessionData = HonoSessionData> = {
	Variables: { session: HonoSession<T> };
};

export type HonoSessionOptions<T extends HonoSessionData = HonoSessionData> = {
	store?: SessionStore<T>;
	name?: string;
	secret: string;
	cookieOptions?: CookieOptions;
	generateId?: () => string;
	hashData?: (data: T) => string;
};

export type HonoSessionOpts<T extends HonoSessionData = HonoSessionData> = HonoSessionOptions<T> &
	Required<Pick<HonoSessionOptions<T>, 'store' | 'name' | 'cookieOptions' | 'hashData'>>;

export function session<T extends HonoSessionData = HonoSessionData>(
	options: HonoSessionOptions<T>
): MiddlewareHandler<HonoSessionEnv<T>> {
	const opts = {
		store: options.store ?? new MemoryStore(1000 * 60 * 60 * 24),
		name: options.name ?? 'sid',
		secret: options.secret,
		cookieOptions: options.cookieOptions ?? { path: '/', httpOnly: true },
		generateId: options.generateId,
		hashData: options.hashData ?? hashData
	} as HonoSessionOpts<T>;

	const NO_SESSION_HASH = opts.hashData({} as T);

	return async (ctx, next) => {
		const session = await getSession<T>(ctx, opts);

		ctx.set('session', session);

		const beginHash = opts.hashData(session.data);

		await next();

		if (!session.data) {
			await deleteSession<T>(ctx, opts);
			return;
		}

		let endHash: string;
		try {
			endHash = opts.hashData(session.data);
		} catch (err) {
			throw new Error(`failed to serialize session data: ${err}`);
		}
		if (endHash === NO_SESSION_HASH) {
			await deleteSession<T>(ctx, opts);
		} else if (beginHash !== endHash) {
			await saveSession<T>(ctx, opts);
		} else {
			await touchSession<T>(ctx, opts);
		}
	};
}
