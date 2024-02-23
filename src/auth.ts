import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia } from "lucia";
import { createClient } from "@libsql/client";
import { drizzle } from 'drizzle-orm/libsql';

const client = createClient({ 
  url: import.meta.env.TURSO_DATABASE_URL, 
  authToken: import.meta.env.TURSO_AUTH_TOKEN
})

export const userTable = sqliteTable("user", {
	id: text("id").notNull().primaryKey(),
  username: text("username").unique(),
  hashed_password: text("hashed_password")
});

export const sessionTable = sqliteTable("session", {
	id: text("id").notNull().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: integer("expires_at").notNull()
});

export const db = drizzle(client)
const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: import.meta.env.PROD
		}
	},
  getUserAttributes: (attributes) => {
		return {
			// attributes has the type of DatabaseUserAttributes
			username: attributes.username
		};
	}
});

// !MPORTANT!
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
    User: User;
	}
}

interface User {
  username: string;
}
