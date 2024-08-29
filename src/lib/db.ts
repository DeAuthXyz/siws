import type { CodeEntry, SessionEntry, ClientEntry } from './types';

export interface DBClient {
	getCode(code: string): Promise<CodeEntry | null>;
	setCode(code: string, entry: CodeEntry): Promise<void>;
	getSession(sessionId: string): Promise<SessionEntry | null>;
	setSession(sessionId: string, entry: SessionEntry): Promise<void>;
	getClient(clientId: string): Promise<ClientEntry | null>;
	setClient(clientId: string, entry: ClientEntry): Promise<void>;
	deleteClient(clientId: string): Promise<void>;
}

// Implement an in-memory database for demonstration purposes
class InMemoryDBClient implements DBClient {
	private codes: Map<string, CodeEntry> = new Map();
	private sessions: Map<string, SessionEntry> = new Map();
	private clients: Map<string, ClientEntry> = new Map();

	async getCode(code: string): Promise<CodeEntry | null> {
		return this.codes.get(code) || null;
	}

	async setCode(code: string, entry: CodeEntry): Promise<void> {
		this.codes.set(code, entry);
	}

	async getSession(sessionId: string): Promise<SessionEntry | null> {
		return this.sessions.get(sessionId) || null;
	}

	async setSession(sessionId: string, entry: SessionEntry): Promise<void> {
		this.sessions.set(sessionId, entry);
	}

	async getClient(clientId: string): Promise<ClientEntry | null> {
		return this.clients.get(clientId) || null;
	}

	async setClient(clientId: string, entry: ClientEntry): Promise<void> {
		this.clients.set(clientId, entry);
	}

	async deleteClient(clientId: string): Promise<void> {
		this.clients.delete(clientId);
	}
}

// Export a singleton instance of the database client
export const dbClient = new InMemoryDBClient();
