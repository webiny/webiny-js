import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    createWebsocketsConnection,
    WEBSOCKETS_HEARTBEAT_ACTION
} from "~/domain/WebsocketsConnection.js";
import { createWebsocketsSubscriptionManager } from "~/domain/WebsocketsSubscriptionManager.js";
import { WebsocketsCloseCode, WebsocketsReadyState } from "~/domain/types.js";

class FakeSocket extends EventTarget {
    public readyState: number = WebsocketsReadyState.CONNECTING;
    public readonly sent: string[] = [];

    public constructor(public readonly url: string) {
        super();
    }

    public open() {
        this.readyState = WebsocketsReadyState.OPEN;
        this.dispatchEvent(new Event("open"));
    }

    // A close the client did not ask for: API Gateway idle timeout, network drop, ...
    public drop(code: number = WebsocketsCloseCode.ABNORMAL) {
        this.readyState = WebsocketsReadyState.CLOSED;
        this.dispatchEvent(new CloseEvent("close", { code, reason: "", wasClean: false }));
    }

    public send(data: string) {
        this.sent.push(data);
    }

    public close(code?: number, reason?: string) {
        this.readyState = WebsocketsReadyState.CLOSED;
        this.dispatchEvent(new CloseEvent("close", { code, reason, wasClean: true }));
    }
}

const HEARTBEAT = 1000;

const setup = (getToken: () => Promise<string | undefined> = async () => "token") => {
    const sockets: FakeSocket[] = [];
    const connection = createWebsocketsConnection({
        url: "wss://example.com/dev",
        tenant: "root",
        getToken,
        subscriptionManager: createWebsocketsSubscriptionManager(),
        factory: url => {
            const socket = new FakeSocket(url);
            sockets.push(socket);
            return socket as unknown as WebSocket;
        },
        heartbeatInterval: HEARTBEAT,
        reconnectDelay: attempt => 100 * (attempt + 1)
    });
    return { connection, sockets };
};

describe("WebsocketsConnection", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        // The connection lives on `window` so it survives hot reloads; start every test clean.
        window.WebinyWebsocketsConnectionCache.ws = null;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("reconnects after a close it did not ask for, whatever the close code", async () => {
        const { connection, sockets } = setup();
        await connection.connect();
        sockets[0].open();

        // 1006 used to be ignored: only 1001 triggered a reconnect.
        sockets[0].drop(WebsocketsCloseCode.ABNORMAL);
        expect(sockets).toHaveLength(1);

        await vi.advanceTimersByTimeAsync(100);
        expect(sockets).toHaveLength(2);
        expect(sockets[1].url).toBe("wss://example.com/dev?token=token&tenant=root");
    });

    it("backs off between failed attempts and resets once a connection opens", async () => {
        const { connection, sockets } = setup();
        await connection.connect();
        sockets[0].open();

        sockets[0].drop();
        await vi.advanceTimersByTimeAsync(100);
        expect(sockets).toHaveLength(2);

        // Second socket fails before opening: the next attempt waits longer.
        sockets[1].drop();
        await vi.advanceTimersByTimeAsync(100);
        expect(sockets).toHaveLength(2);
        await vi.advanceTimersByTimeAsync(100);
        expect(sockets).toHaveLength(3);

        // Once one opens, the delay starts from the beginning again.
        sockets[2].open();
        sockets[2].drop();
        await vi.advanceTimersByTimeAsync(100);
        expect(sockets).toHaveLength(4);
    });

    it("keeps reconnecting past the old limit of five attempts", async () => {
        const { connection, sockets } = setup();
        await connection.connect();

        for (let i = 0; i < 8; i++) {
            sockets[sockets.length - 1].open();
            sockets[sockets.length - 1].drop();
            await vi.advanceTimersByTimeAsync(100);
        }

        expect(sockets).toHaveLength(9);
    });

    it("does not reconnect after close() is called", async () => {
        const { connection, sockets } = setup();
        await connection.connect();
        sockets[0].open();

        await connection.close(WebsocketsCloseCode.NORMAL, "Changing tenant.");
        await vi.advanceTimersByTimeAsync(60_000);

        expect(sockets).toHaveLength(1);
    });

    it("opens one socket when connect() is called again while the token is still pending", async () => {
        const pendingTokens: Array<(token: string) => void> = [];
        const { connection, sockets } = setup(
            () => new Promise<string>(resolve => pendingTokens.push(resolve))
        );

        // E.g. the reconnect timer and the window-focus handler firing together.
        const first = connection.connect();
        const second = connection.connect();
        pendingTokens.forEach(resolve => resolve("token"));
        await Promise.all([first, second]);

        expect(pendingTokens).toHaveLength(1);
        expect(sockets).toHaveLength(1);
    });

    it("does not open a socket when close() runs while a reconnect waits for its token", async () => {
        let resolveToken: (token: string) => void = () => {};
        let pending = false;
        const { connection, sockets } = setup(() => {
            if (!pending) {
                return Promise.resolve("token");
            }
            return new Promise<string>(resolve => (resolveToken = resolve));
        });
        await connection.connect();
        sockets[0].open();

        // The next token request (the reconnect's) stays pending until we resolve it.
        pending = true;
        sockets[0].drop();
        await vi.advanceTimersByTimeAsync(100);

        // E.g. a tenant change closes the connection mid-attempt.
        await connection.close(WebsocketsCloseCode.NORMAL, "Changing tenant.");
        resolveToken("token");
        await vi.advanceTimersByTimeAsync(60_000);

        expect(sockets).toHaveLength(1);
    });

    it("stops retrying when close() runs while a failing reconnect is in flight", async () => {
        let rejectToken: (error: Error) => void = () => {};
        let pending = false;
        const { connection, sockets } = setup(() => {
            if (!pending) {
                return Promise.resolve("token");
            }
            return new Promise<string>((_, reject) => (rejectToken = reject));
        });
        vi.spyOn(console, "error").mockImplementation(() => {});
        await connection.connect();
        sockets[0].open();

        pending = true;
        sockets[0].drop();
        await vi.advanceTimersByTimeAsync(100);

        await connection.close(WebsocketsCloseCode.NORMAL, "Changing tenant.");
        rejectToken(new Error("Token refresh failed."));
        await vi.advanceTimersByTimeAsync(60_000);

        // Without the generation check the failed attempt scheduled another retry here.
        expect(console.error).not.toHaveBeenCalledWith(
            "Websockets reconnect failed.",
            expect.anything()
        );
        expect(sockets).toHaveLength(1);
    });

    it("sends a heartbeat while open, and stops once the socket closes", async () => {
        const { connection, sockets } = setup();
        await connection.connect();
        sockets[0].open();

        await vi.advanceTimersByTimeAsync(HEARTBEAT);
        expect(sockets[0].sent.map(data => JSON.parse(data))).toEqual([
            { action: WEBSOCKETS_HEARTBEAT_ACTION, token: "token", tenant: "root" }
        ]);

        await connection.close(WebsocketsCloseCode.NORMAL, "Done.");
        await vi.advanceTimersByTimeAsync(HEARTBEAT * 3);
        expect(sockets[0].sent).toHaveLength(1);
    });
});
