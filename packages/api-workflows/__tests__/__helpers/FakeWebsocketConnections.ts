import { Result } from "@webiny/feature/api";
import {
    WebsocketsListConnectionsUseCase,
    type WebsocketsError
} from "@webiny/api-websockets/exports/api.js";
import { FakeWebsocketFailure } from "./FakeWebsocketFailure.js";

export type WebsocketFakeMode = "ok" | "fail" | "throw";

/**
 * `WebsocketsListConnectionsUseCase` over a fixed set of connections, listed per identity like the
 * real one (no identity: every connection, the way `where: { identityId: "" }` would behave, so a
 * test can prove the notifier never asks). Records every call. `mode` makes the calls fail or
 * throw (all of them, or only the ones for `onlyFor`); `holdMs` keeps a call in flight so a test
 * can measure concurrency. Register with
 * `container.registerInstance(WebsocketsListConnectionsUseCase, fake)`.
 */
export class FakeWebsocketConnections implements WebsocketsListConnectionsUseCase.Interface {
    public readonly calls: WebsocketsListConnectionsUseCase.Params[] = [];
    public mode: WebsocketFakeMode = "ok";
    /** When set, `mode` applies only to the listing of this identity id. */
    public onlyFor: string | null = null;
    public failureMessage = "The connection list failed.";
    public holdMs = 0;
    public inFlight = 0;
    public maxInFlight = 0;
    private readonly rows = new Map<string, WebsocketsListConnectionsUseCase.RegistryData[]>();

    /** Adds one live connection of `identityId` in `tenant`. */
    public connect(
        identityId: string,
        tenant: string,
        connectionId = `${identityId}:${tenant}`
    ): this {
        const rows = this.rows.get(identityId) ?? [];
        rows.push({
            connectionId,
            identity: { id: identityId, displayName: identityId, type: "admin" },
            tenant,
            connectedOn: new Date().toISOString(),
            endpoint: "wss://websockets.test"
        });
        this.rows.set(identityId, rows);
        return this;
    }

    public async execute(
        params?: WebsocketsListConnectionsUseCase.Params
    ): Promise<Result<WebsocketsListConnectionsUseCase.RegistryData[], WebsocketsError>> {
        this.calls.push(structuredClone(params ?? {}));
        this.inFlight += 1;
        this.maxInFlight = Math.max(this.maxInFlight, this.inFlight);
        try {
            if (this.holdMs > 0) {
                await new Promise<void>(resolve => setTimeout(resolve, this.holdMs));
            }
            const identityId = params?.where?.identityId;
            const applies = this.onlyFor === null || this.onlyFor === identityId;
            if (applies && this.mode === "throw") {
                throw new Error(this.failureMessage);
            }
            if (applies && this.mode === "fail") {
                return Result.fail(new FakeWebsocketFailure(this.failureMessage) as never);
            }
            const rows = identityId
                ? (this.rows.get(identityId) ?? [])
                : [...this.rows.values()].flat();
            return Result.ok(rows.map(row => ({ ...row, identity: { ...row.identity } })));
        } finally {
            this.inFlight -= 1;
        }
    }
}
