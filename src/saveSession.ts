import type { Context } from 'hono';
import { setSignedCookie } from 'hono/cookie';
import type { HonoSessionData, HonoSessionEnv, HonoSessionOpts } from './session';

export async function saveSession<T extends HonoSessionData = HonoSessionData>(
	ctx: Context<HonoSessionEnv<T>>,
	opt: HonoSessionOpts<T>
) {
	if (!ctx.var.session.id) {
		ctx.var.session.id = opt.generateId!();
	}
	await Promise.allSettled([
		opt.store.set(ctx.var.session.id, ctx.var.session.data),
		setSignedCookie(ctx, opt.name, ctx.var.session.id, opt.secret, opt.cookieOptions),
	]);
}
