/**
 * What delivering to this process's sockets needs: the socket of a connection, and a way to remove a
 * connection that is gone (its socket and its row). Outside a request that is the connection manager;
 * inside one, the request's own registry removes the row.
 */
export interface LocalSockets {
    getSocket(connectionId: string): unknown | undefined;
    remove(connectionId: string): Promise<void>;
}
