import type { Context } from 'hono';
import { getSignedCookie } from 'hono/cookie';
import type { HonoSession, HonoSessionData, HonoSessionEnv, HonoSessionOpts } from './session';

export async function getSession<T extends HonoSessionData = HonoSessionData>(
	ctx: Context<HonoSessionEnv<T>>,
	opts: HonoSessionOpts<T>
) {
	const session: HonoSession = {
		data: {},
		clear() {
			session.data = {};
		},
	};
	let sessionId = await getSignedCookie(ctx, opts.secret, opts.name);
	if (sessionId) {
		const data = await opts.store.get(sessionId);
		if (data) {
			session.data = data;
		} else {
			sessionId = undefined;
		}
	} else {
		sessionId = undefined;
	}
	if (sessionId) {
		session.id = sessionId;
	}
	return session as HonoSession<T>;
}
