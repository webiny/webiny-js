import { createAbstraction } from "@webiny/feature/api";

/*
 * Per-process token generated at startup, shared between WorkerService and BackgroundTaskRoute
 * via DI. Workers send it as a header; the route rejects requests without a matching value.
 * This only works within a single server process. For multi-server deployments where workers
 * on one server may hit another server's route, replace with a shared secret (env var or
 * config service).
 */

interface IInternalToken {
    readonly value: string;
}

export const InternalToken = createAbstraction<IInternalToken>("BackgroundTasks/InternalToken");

export namespace InternalToken {
    export type Interface = IInternalToken;
}
