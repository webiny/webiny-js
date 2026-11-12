export interface PgConnectionStringValues {
    host?: string;
    port?: number | string;
    user?: string;
    password?: string;
    database?: string;
}

/**
 * Stands in for a missing host while the string is a `URL`, as node-postgres does: `URL` rejects
 * `postgres://user:pw@/db` and won't take a user, password or port on a URL without a host.
 */
const DUMMY_HOST = "___dummy___";

/**
 * Writes connection settings into a Postgres connection string, so they win over it. node-postgres
 * reads a connection string over the separate settings (`host`, `password`, …), and the string's
 * query parameters (`?host=`, `?port=`, `?user=`, `?password=`) over its own parts. So each value is
 * written into the string and the query parameter of the same name is removed. Values that aren't
 * set (`undefined` or `""`) leave the string's own as they are.
 *
 * A string node-postgres can't parse either is returned as it is, so node-postgres reports it.
 */
export function applyToPgConnectionString(
    connectionString: string,
    values: PgConnectionStringValues
): string {
    const url = parsePgConnectionString(connectionString);
    if (!url) {
        return connectionString;
    }
    const isSet = (value: unknown): boolean => value !== undefined && value !== "";

    if (isSet(values.host)) {
        const host = values.host as string;
        url.searchParams.delete("host");
        if (host.startsWith("/")) {
            // A Unix socket directory can't be a URL host; node-postgres reads it from the query.
            url.searchParams.set("host", host);
        } else {
            url.hostname = host;
        }
    }
    if (isSet(values.port)) {
        url.searchParams.delete("port");
        if (url.hostname === DUMMY_HOST) {
            // The dummy host is removed again below, and a port can't follow an empty host.
            url.searchParams.set("port", String(values.port));
        } else {
            url.port = String(values.port);
        }
    }
    if (isSet(values.user)) {
        url.searchParams.delete("user");
        url.username = encodeURIComponent(values.user as string);
    }
    if (values.password !== undefined) {
        url.searchParams.delete("password");
        url.password = encodeURIComponent(values.password);
    }
    if (isSet(values.database)) {
        url.pathname = pgDatabasePath(values.database as string);
    }

    if (url.hostname !== DUMMY_HOST) {
        return url.toString();
    }
    if (url.pathname === "") {
        // `user:pw@?…` doesn't parse, and node-postgres only puts a host back before `@/`. It reads
        // the path `/` as no database, as it reads an empty one.
        url.pathname = "/";
    }
    return url
        .toString()
        .replace(new RegExp(`^([a-z][a-z0-9+.-]*://(?:[^/@]*@)?)${DUMMY_HOST}`, "i"), "$1");
}

/**
 * The password a connection string carries, in its query (which wins) or in the URI, as written
 * there (still percent-encoded). It tells whether the string has a password, not what it is.
 */
export function pgConnectionStringPassword(connectionString: string): string {
    const url = parsePgConnectionString(connectionString);
    if (!url) {
        return "";
    }
    return url.searchParams.get("password") || url.password;
}

/**
 * Parses a connection string as node-postgres (pg-connection-string) does, with `DUMMY_HOST` where
 * it has no host. `null` when node-postgres can't parse it either.
 */
function parsePgConnectionString(connectionString: string): URL | null {
    // libpq's socket form: "<socket directory> [database]".
    if (connectionString.startsWith("/")) {
        const [host, database] = connectionString.split(" ");
        const url = new URL(`postgres://${DUMMY_HOST}`);
        url.searchParams.set("host", host);
        if (database) {
            url.pathname = pgDatabasePath(database);
        }
        return url;
    }

    let str = connectionString;
    if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
        // Spaces and stray "%" are encoded first, as node-postgres does.
        str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
    }
    let url: URL;
    try {
        url = new URL(str);
    } catch {
        try {
            url = new URL(str.replace("@/", `@${DUMMY_HOST}/`));
        } catch {
            return null;
        }
    }
    if (url.hostname === "") {
        url.hostname = DUMMY_HOST;
    }
    return url;
}

/**
 * The URL path for a database name. node-postgres reads the path back with `decodeURI`, which
 * decodes everything `encodeURI` encodes and leaves the escapes of `#` and `?` as they are, so those
 * two can't be written at all (the `?database=` query is overwritten by the path).
 */
function pgDatabasePath(database: string): string {
    if (/[#?]/.test(database)) {
        throw new Error(
            `The Postgres database name "${database}" can't be written into a connection string: it contains "#" or "?".`
        );
    }
    return `/${encodeURI(database)}`;
}
