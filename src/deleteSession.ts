import type { Context } from 'hono';
import { deleteCookie } from 'hono/cookie';
import type { HonoSessionData, HonoSessionEnv, HonoSessionOpts } from './session';

export async function deleteSession<T extends HonoSessionData>(
	ctx: Context<HonoSessionEnv<T>>,
	opts: HonoSessionOpts<T>
) {
	if (ctx.var.session.id) {
		await opts.store.delete(ctx.var.session.id);
	}
	deleteCookie(ctx, opts.name, opts.cookieOptions);
}
