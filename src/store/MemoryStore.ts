import type { SessionStore } from '../session';

export class MemoryStore<T> implements SessionStore<T> {
	private readonly sessions = new Map<string, { expiry?: number; data: T }>();

	constructor(private readonly _maxAgeMS?: number) {
		if (_maxAgeMS) {
			setInterval(() => this.clean(), 60000);
		}
	}

	clean() {
		const now = Date.now();
		for (const [sid, session] of this.sessions.entries()) {
			if (session.expiry && session.expiry < now) {
				this.sessions.delete(sid);
			}
		}
	}

	async get(sid: string) {
		console.log('get', sid);
		return this.sessions.get(sid)?.data;
	}

	async set(sid: string, data: T) {
		console.log('set', sid);
		this.sessions.set(sid, {
			expiry: this._maxAgeMS ? Date.now() + this._maxAgeMS : undefined,
			data,
		});
	}

	async delete(sid: string) {
		this.sessions.delete(sid);
	}

	async touch(sid: string) {
		console.log('touch', sid);
		if (!this._maxAgeMS) {
			return;
		}
		const session = this.sessions.get(sid);
		if (session) {
			session.expiry = Date.now() + this._maxAgeMS;
		}
	}
}
