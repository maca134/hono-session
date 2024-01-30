import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { HonoSessionEnv } from '../src/session';
import { session } from '../src/session';

type MySessionData = {
	id?: number;
	name?: string;
};

const app = new Hono<HonoSessionEnv<MySessionData>>();
app.use('*', session({ secret: '123' }));

app.get('/', (c) => {
	return c.html(`
		<pre>${JSON.stringify(c.var.session.data, null, 2)}</pre>
		<a href="/">Refresh</a>
		<a href="/inc">Inc</a>
		<a href="/clear">Clear</a>
	`);
});

app.get('/inc', (c) => {
	c.var.session.data.id = c.var.session.data.id ? c.var.session.data.id + 1 : 1;
	return c.html(`
		<pre>${JSON.stringify(c.var.session.data, null, 2)}</pre>
		<a href="/">Back</a>
	`);
});

app.get('/clear', (c) => {
	c.var.session.clear();
	return c.html(`
		<pre>${JSON.stringify(c.var.session.data, null, 2)}</pre>
		<a href="/">Back</a>
	`);
});

serve({ fetch: app.fetch, port: 3000 });
console.log('Server running on http://localhost:3000');
