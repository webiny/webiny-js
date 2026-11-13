import { createImplementation } from "@webiny/feature/api";
import {
    Debugger as DebuggerAbstraction,
    DebuggerTransport,
    type DebugNamespace,
    type IDebugDeliveryTarget,
    type IDebugEntry,
    type IDebuggerStartParams,
    type IDebugPayloadFactory,
    type IDebugSession
} from "./abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { BuildParams } from "~/features/buildParams/index.js";
import { createNamespaceFilter, type INamespaceFilter } from "./matchNamespace.js";
import { DEFAULT_LIMITS, type IDebuggerLimits } from "./limits.js";
import { serialize } from "./serialize.js";

const FLUSH_TIMEOUT_MS = 2000;

/**
 * Renders an error for logging without touching anything that could hold a captured payload.
 *
 * Deliberately not `stringifyError` from `@webiny/handler`: that spreads the whole error object, so
 * an error carrying a `data` property would put debug payloads into CloudWatch - the one sink they
 * must never reach.
 */
const describeError = (error: unknown): string => {
    if (error instanceof Error) {
        return `${error.name}: ${error.message}`;
    }
    return "Unknown error.";
};

interface IActiveSession extends IDebugSession {
    filter: INamespaceFilter;
    seq: number;
}

export class DebuggerImpl implements DebuggerAbstraction.Interface {
    private session: IActiveSession | undefined = undefined;
    private readonly limits: IDebuggerLimits = DEFAULT_LIMITS;

    public constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly buildParams: BuildParams.Interface,
        private readonly transports: DebuggerTransport.Interface[]
    ) {}

    public start(params: IDebuggerStartParams): void {
        if (this.isDisabled()) {
            return;
        }

        if (params.namespaces.length === 0) {
            return;
        }

        /**
         * Always replace. A session surviving into the next request would mean one identity
         * receiving another's entries.
         */
        this.session = {
            namespaces: params.namespaces,
            filter: createNamespaceFilter(params.namespaces),
            startedAt: Date.now(),
            entries: [],
            bytes: 0,
            dropped: 0,
            truncated: false,
            seq: 0
        };
    }

    public isEnabled(namespace: DebugNamespace): boolean {
        const session = this.session;
        if (!session) {
            return false;
        }

        /**
         * An anonymous identity must never accumulate payloads. The flush-time permission check is
         * authoritative, but this earlier gate means there is nothing to leak if a future code path
         * delivers a session without passing through it.
         */
        if (this.identityContext.getIdentity().isAnonymous()) {
            return false;
        }

        return session.filter.matches(namespace);
    }

    public log(namespace: DebugNamespace, payload: IDebugPayloadFactory): void {
        /**
         * The debugger must never be able to break the request it is observing, and payload
         * factories are written in a hurry during an incident.
         */
        try {
            const session = this.session;
            if (!session || !this.isEnabled(namespace)) {
                return;
            }

            if (session.entries.length >= this.limits.entryCount) {
                return;
            }

            /**
             * Invoke and serialize immediately: this releases the closure and the payload graph, and
             * it is what makes the entry's size known, which is what makes the budget enforceable.
             */
            const { json, bytes, truncated } = serialize(payload(), this.limits);

            const entry: IDebugEntry = {
                seq: ++session.seq,
                namespace,
                timestamp: Date.now(),
                elapsed: Date.now() - session.startedAt,
                json,
                bytes
            };

            session.entries.push(entry);
            session.bytes += bytes;
            session.truncated = session.truncated || truncated;

            this.enforceBudget(session);
        } catch (ex) {
            console.error(`Debugger failed to capture "${namespace}".`, describeError(ex));
        }
    }

    public async flush(target: IDebugDeliveryTarget): Promise<void> {
        const session = this.session;
        this.session = undefined;

        if (!session) {
            return;
        }

        const transports = this.transports.filter(transport => {
            try {
                return transport.canDeliver(target);
            } catch {
                return false;
            }
        });

        if (transports.length === 0) {
            return;
        }

        const frozen = Object.freeze({
            namespaces: session.namespaces,
            startedAt: session.startedAt,
            entries: session.entries,
            bytes: session.bytes,
            dropped: session.dropped,
            truncated: session.truncated
        }) as IDebugSession;

        const delivery = Promise.allSettled(
            transports.map(async transport => {
                return await transport.deliver({ target, session: frozen });
            })
        );

        /**
         * In-memory delivery is instant, but a future network sink is not, and debug data is never
         * worth making the app feel broken. The timer is cleared so it cannot hold the event loop
         * open between the response and the Lambda freeze.
         */
        let timer: NodeJS.Timeout | undefined;
        const timeout = new Promise<void>(resolve => {
            timer = setTimeout(resolve, FLUSH_TIMEOUT_MS);
        });

        try {
            const results = await Promise.race([delivery, timeout]);
            if (Array.isArray(results)) {
                for (const result of results) {
                    if (result.status === "rejected") {
                        /**
                         * Only the error - never the session or any entry. `console.error` goes to
                         * CloudWatch, which is the one place debug payloads must never reach.
                         */
                        console.error(
                            "Debugger transport failed to deliver.",
                            describeError(result.reason)
                        );
                    }
                }
            }
        } finally {
            if (timer) {
                clearTimeout(timer);
            }
        }
    }

    public discard(): void {
        this.session = undefined;
    }

    private isDisabled(): boolean {
        return this.buildParams.get<boolean>("DebuggerDisabled") === true;
    }

    /**
     * Drops entries from the front until the session fits the byte budget. The client reproduces the
     * bug, so the failure is at the end of the session and the tail is what matters.
     */
    private enforceBudget(session: IActiveSession): void {
        while (session.bytes > this.limits.totalBytes && session.entries.length > 0) {
            const removed = session.entries.shift();
            if (!removed) {
                break;
            }
            session.bytes -= removed.bytes;
            session.dropped++;
        }
    }
}

export const Debugger = createImplementation({
    abstraction: DebuggerAbstraction,
    implementation: DebuggerImpl,
    dependencies: [IdentityContext, BuildParams, [DebuggerTransport, { multiple: true }]]
});
