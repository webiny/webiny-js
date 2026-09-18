import {
    createBeforeHandlerPlugin,
    createHandlerResultPlugin,
    Request,
    RequestId
} from "@webiny/handler";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { Context } from "@webiny/handler/types.js";
import { Debugger } from "./abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { parseNamespaceHeader } from "./matchNamespace.js";
import {
    GRAPHQL_TARGET,
    writeExtension,
    type IGraphQLDeliveryTarget
} from "./GraphQLDebuggerTransport.js";

export const DEBUG_HEADER = "x-webiny-debug";
export const DEBUG_PERMISSION = "debugger.capture";

const isPlainObject = (value: unknown): value is Record<string, any> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * A GraphQL result carries `data` or `errors`. Anything else - asset delivery, a plain string body -
 * is not ours to write to.
 */
const isGraphQLResult = (value: unknown): value is Record<string, any> => {
    return isPlainObject(value) && ("data" in value || "errors" in value);
};

/**
 * Batched requests produce an array of results. The session spans the whole HTTP request, so it is
 * attached once, to the last element - duplicating it per operation would multiply it against the
 * byte budget.
 */
const resolveTarget = (payload: unknown): Record<string, any> | undefined => {
    const candidate = Array.isArray(payload) ? payload.at(-1) : payload;
    return isGraphQLResult(candidate) ? candidate : undefined;
};

const readOperationNames = (body: unknown): string[] => {
    const operations = Array.isArray(body) ? body : [body];
    return operations
        .map(operation => {
            return isPlainObject(operation) && typeof operation.operationName === "string"
                ? operation.operationName
                : undefined;
        })
        .filter((name): name is string => Boolean(name));
};

/**
 * Opens the capture session.
 *
 * Runs as a `BeforeHandlerPlugin`, so it is in place before the route handler and therefore before
 * any resolver. Note that `ContextPlugin`s run earlier still, so anything logged from one of those
 * is not captured.
 */
const createStartPlugin = () => {
    return createBeforeHandlerPlugin<Context>(async context => {
        /**
         * Must never throw: `ProcessBeforeHandlerPlugins` rethrows, which would turn a malformed
         * header into a 500 for the whole request.
         */
        try {
            const request = context.container.resolve(Request);
            const namespaces = parseNamespaceHeader(request.headers[DEBUG_HEADER]);

            if (namespaces.length === 0) {
                return;
            }

            context.container.resolve(Debugger).start({ namespaces });
        } catch {
            // A debugger that cannot start is not a reason to fail the request.
        }
    });
};

/**
 * Performs the permission gate and hands the session to the transports.
 *
 * This runs once per HTTP response, in the `preSerialization` hook - deliberately not in
 * `graphql-after-query`, which also fires for the nested executions that CMS resolvers perform
 * internally and would attach the session to a result that is then discarded.
 */
const createFlushPlugin = () => {
    return createHandlerResultPlugin<Context>(async (context, payload) => {
        /**
         * The whole body is guarded: `preSerialization` rethrows whatever a `HandlerResultPlugin`
         * throws, so an error here would turn a working response into a 500 - and only for requests
         * that asked for debugging.
         */
        try {
            const debuggerService = context.container.resolve(Debugger);
            const identityContext = context.container.resolve(IdentityContext);

            const result = resolveTarget(payload);
            if (!result) {
                debuggerService.discard();
                return payload;
            }

            /**
             * Anonymous callers get no `debug` key at all. Reporting `{ enabled: false }` would
             * fingerprint the feature to any unauthenticated caller for no benefit.
             */
            if (identityContext.getIdentity().isAnonymous()) {
                debuggerService.discard();
                return payload;
            }

            /**
             * `getPermission` returns a wildcard permission whenever authorization is disabled, so a
             * flush occurring inside a `withoutAuthorization` scope would pass for anyone.
             */
            const isAuthorized =
                identityContext.isAuthorizationEnabled() &&
                Boolean(await identityContext.getPermission(DEBUG_PERMISSION));

            if (!isAuthorized) {
                debuggerService.discard();
                writeExtension(result, { enabled: false });
                return payload;
            }

            let operations: string[] = [];
            let requestId = "";
            try {
                operations = readOperationNames(context.container.resolve(Request).body);
                requestId = context.container.resolve(RequestId).value;
            } catch {
                // Both are conveniences; their absence must not stop the flush.
            }

            const target: IGraphQLDeliveryTarget = {
                type: GRAPHQL_TARGET,
                result,
                requestId,
                operations
            };

            await debuggerService.flush(target);
        } catch (ex) {
            /**
             * Only the message - never the session or the payload.
             */
            console.error(
                "Debugger failed to flush.",
                ex instanceof Error ? `${ex.name}: ${ex.message}` : "Unknown error."
            );
            try {
                context.container.resolve(Debugger).discard();
            } catch {
                // Nothing further to do.i
            }
        }

        /**
         * `preSerialization` ignores this return value and serializes the original payload object,
         * so every write above mutates `result` in place.
         */
        return payload;
    });
};

export const createDebuggerPlugins = (): PluginCollection => {
    return [createStartPlugin(), createFlushPlugin()];
};
