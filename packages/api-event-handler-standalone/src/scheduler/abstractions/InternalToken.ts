import { createAbstraction } from "@webiny/feature/api";

/**
 * Per-process token generated at startup, shared between the in-process Bree scheduler singleton and
 * the scheduler routes via DI. The singleton sends it as a header when a timer fires; the routes
 * reject requests without a matching value. Single-process only — for multi-server, replace with a
 * shared secret. Mirrors the background-tasks InternalToken.
 */
interface IInternalToken {
    readonly value: string;
}

export const SchedulerInternalToken = createAbstraction<IInternalToken>(
    "SchedulerServer/InternalToken"
);

export namespace SchedulerInternalToken {
    export type Interface = IInternalToken;
}
