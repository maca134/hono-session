import { Hono } from 'hono';
import { vi } from 'vitest';
import type { Mock } from 'vitest';
import type { HonoSessionEnv, HonoSessionOptions, SessionStore } from './session';
import { session } from './session';

type MySessionData = {
	id?: number;
	name?: string;
};

const sampleData: MySessionData = { id: 1, name: 'hono' };

const store: SessionStore<MySessionData> = {
	get: vi.fn((_: string) => Promise.resolve(sampleData)),
	set: vi.fn((_: string, __: MySessionData) => Promise.resolve()),
	delete: vi.fn((_: string) => Promise.resolve()),
	touch: vi.fn((_: string) => Promise.resolve()),
};

const sessionConfig: HonoSessionOptions<MySessionData> = {
	secret: '123',
	store,
	generateId: vi.fn(() => '123'),
	cookieOptions: {
		maxAge: 86400,
		path: '/',
		httpOnly: true,
		sameSite: 'Strict',
		secure: false,
	},
};

const sessionId = '123.PK%2FkD5K%2Basd9J5K0smfC2hHj8wh7k7sZxsUTN4aYS0Q%3D';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFnc<T extends (...args: any) => any> = Mock<T>;

describe('session', () => {
	let app: Hono<HonoSessionEnv<MySessionData>>;

	beforeEach(() => {
		app = new Hono<HonoSessionEnv<MySessionData>>();
		app.use('*', session(sessionConfig));

		app.get('/nothing', async (ctx) => {
			return ctx.json({
				status: 'ok',
			});
		});

		app.get('/create', async (ctx) => {
			ctx.var.session.data = { ...sampleData };
			return ctx.json({
				status: 'ok',
			});
		});

		app.get('/delete', async (ctx) => {
			ctx.var.session.clear();
			return ctx.json({
				status: 'ok',
			});
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('session is not created', async () => {
		const request = await app.request('/nothing');
		const cookie = request.headers.get('set-cookie');
		expect(cookie).toBe('sid=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict');
	});

	it('session is created', async () => {
		const request = await app.request('/create');
		const cookie = request.headers.get('set-cookie');
		expect(cookie).toBe(`sid=${sessionId}; Max-Age=86400; Path=/; HttpOnly; SameSite=Strict`);
		expect(store.set).toHaveBeenCalledTimes(1);
		expect(store.set).toHaveBeenCalledWith('123', expect.objectContaining(sampleData));
		expect(sessionConfig.generateId).toHaveBeenCalledTimes(1);
	});

	it('session is loaded', async () => {
		const request = await app.request('/nothing', {
			headers: {
				cookie: `sid=${sessionId}`,
			},
		});
		const cookie = request.headers.get('set-cookie');
		expect(cookie).toBe(`sid=${sessionId}; Max-Age=86400; Path=/; HttpOnly; SameSite=Strict`);
		expect(store.get).toHaveBeenCalledTimes(1);
		expect(store.get).toHaveBeenCalledWith('123');
	});

	it('session is deleted', async () => {
		const request = await app.request('/delete', {
			headers: {
				cookie: `sid=${sessionId}`,
			},
		});
		const cookie = request.headers.get('set-cookie');
		expect(cookie).toBe('sid=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict');
		expect(store.delete).toHaveBeenCalledTimes(1);
		expect(store.delete).toHaveBeenCalledWith('123');
	});

	it('session is expired', async () => {
		const expiredSessionId = '1234.wXca2Vly7xq4hxQEiYY%2B3k%2Bq10WEQaOopHgUVONotS0%3D';

		(store.get as MockedFnc<typeof store.get>).mockReturnValueOnce(Promise.resolve(undefined));

		const request = await app.request('/nothing', {
			headers: {
				cookie: `sid=${expiredSessionId}`,
			},
		});
		const cookie = request.headers.get('set-cookie');
		expect(cookie).toBe('sid=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict');
	});
});
