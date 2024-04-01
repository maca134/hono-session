import type { Context } from 'hono';
import { setSignedCookie } from 'hono/cookie';
import type { HonoSessionData, HonoSessionEnv, HonoSessionOpts } from './session';

export async function touchSession<T extends HonoSessionData = HonoSessionData>(
	ctx: Context<HonoSessionEnv<T>>,
	opt: HonoSessionOpts<T>
) {
	if (ctx.var.session.id) {
		await Promise.all([
			opt.store.touch(ctx.var.session.id),
			// send cookie on every request?
			setSignedCookie(ctx, opt.name, ctx.var.session.id, opt.secret, opt.cookieOptions),
		]);
	}
}
