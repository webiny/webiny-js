import { HttpRouteHandler } from "@webiny/event-handler-core";
import { RequestId } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import type { IHttpResponseBuilder } from "@webiny/event-handler-core";
import { Debugger } from "./abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { Logger } from "~/features/logger/index.js";
import { parseNamespaceHeader } from "./parseNamespaceHeader.js";
import { canCaptureDebugData } from "./permissions.js";
import { GRAPHQL_TARGET } from "./GraphQLDebuggerTransport.js";
import type { IGraphQLDeliveryTarget } from "./GraphQLDebuggerTransport.js";

export const DEBUG_HEADER = "x-webiny-debug";

type RouteResult = IHttpResponse | IHttpResponseBuilder | void;

const isPlainObject = (value: unknown): value is Record<string, any> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * A GraphQL result carries `data` or `errors`. Anything else (asset delivery, a plain string body)
 * is not ours to write to.
 */
const isGraphQLResult = (value: unknown): value is Record<string, any> => {
    return isPlainObject(value) && ("data" in value || "errors" in value);
};

const isResponseBuilder = (value: unknown): value is IHttpResponseBuilder => {
    return isPlainObject(value) && typeof value.toResponse === "function";
};

/**
 * Finds the body a route produced, whichever of its three return styles it used. The body object is
 * the same reference the transport later serializes, so writing to it is enough.
 */
const readBody = (result: RouteResult, response: IHttpResponseBuilder): unknown => {
    if (isResponseBuilder(result)) {
        return result.toResponse().body;
    }
    if (result) {
        return result.body;
    }
    return response.toResponse().body;
};

/**
 * Batched requests produce an array of results. The session spans the whole HTTP request, so it is
 * attached once, to the last element. Duplicating it per operation would multiply it against the
 * byte budget.
 */
const resolveTarget = (body: unknown): Record<string, any> | undefined => {
    const candidate = Array.isArray(body) ? body.at(-1) : body;
    if (isGraphQLResult(candidate)) {
        return candidate;
    }
    return undefined;
};

const readOperationNames = (body: unknown): string[] => {
    const operations = Array.isArray(body) ? body : [body];
    return operations
        .map(operation => {
            if (isPlainObject(operation) && typeof operation.operationName === "string") {
                return operation.operationName;
            }
            return undefined;
        })
        .filter((name): name is string => Boolean(name));
};

/**
 * Header names are case-insensitive, and the casing that reaches a route depends on the transport.
 */
const readDebugHeader = (headers: Record<string, string> | undefined): string | undefined => {
    if (!headers) {
        return undefined;
    }
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === DEBUG_HEADER) {
            return headers[key];
        }
    }
    return undefined;
};

const describeError = (error: unknown): string => {
    if (error instanceof Error) {
        return `${error.name}: ${error.message}`;
    }
    return "Unknown error.";
};

/**
 * Opens a capture session around every HTTP route and hands it over once the route has produced its
 * response.
 *
 * It wraps the route rather than the GraphQL execution, because CMS resolvers run nested GraphQL
 * executions internally. Attaching there would put the session on a result that is then thrown
 * away; at the route there is exactly one response per request.
 */
class DebuggerRouteDecoratorImpl implements HttpRouteHandler.Interface {
    public constructor(
        private readonly debuggerService: Debugger.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly logger: Logger.Interface,
        private readonly requestId: RequestId.Interface | undefined,
        private readonly decoratee: HttpRouteHandler.Interface
    ) {}

    public async handle(
        request: HttpRouteHandler.Request,
        response: HttpRouteHandler.Response
    ): Promise<RouteResult> {
        this.start(request);

        let result: RouteResult;
        try {
            result = await this.decoratee.handle(request, response);
        } catch (ex) {
            this.debuggerService.discard();
            throw ex;
        }

        await this.flush(request, readBody(result, response));

        return result;
    }

    /**
     * A session starts on every request, and the permission check at flush decides whether anything
     * is delivered or the whole thing is discarded.
     *
     * Nothing is required from the client. The header is honoured when present, so a direct API
     * client can narrow what it captures.
     */
    private start(request: HttpRouteHandler.Request): void {
        /**
         * Must never throw: a malformed header must not turn into a 500 for the whole request.
         */
        try {
            const requested = parseNamespaceHeader(readDebugHeader(request.headers));
            const namespaces = requested.length > 0 ? requested : ["*"];

            this.debuggerService.start({ namespaces });
        } catch {
            // A debugger that cannot start is not a reason to fail the request.
        }
    }

    /**
     * Performs the permission gate and hands the session to the transports.
     *
     * The whole body is guarded: an error here would turn a working response into a 500, and only
     * for the identities that are allowed to debug.
     */
    private async flush(request: HttpRouteHandler.Request, body: unknown): Promise<void> {
        try {
            const result = resolveTarget(body);
            if (!result) {
                this.debuggerService.discard();
                return;
            }

            /**
             * Anonymous callers are rejected before permissions are resolved, because listing them
             * runs every registered authorizer, and some of those hit the database.
             */
            if (this.identityContext.getIdentity().isAnonymous()) {
                this.debuggerService.discard();
                return;
            }

            /**
             * Permission lookups return a wildcard whenever authorization is disabled, so a flush
             * running inside a `withoutAuthorization` scope would pass for anyone.
             */
            const isAuthorized =
                this.identityContext.isAuthorizationEnabled() &&
                (await canCaptureDebugData(this.identityContext));

            if (!isAuthorized) {
                /**
                 * Nothing is written. Reporting the denial would tell every unauthorized caller that
                 * the feature exists, and the Admin app already knows from the identity's own
                 * permissions whether capture is available to it.
                 */
                this.debuggerService.discard();
                return;
            }

            const target: IGraphQLDeliveryTarget = {
                type: GRAPHQL_TARGET,
                result,
                requestId: this.requestId?.value ?? "",
                operations: readOperationNames(request.body),
                /**
                 * Which endpoint this was. An Admin session talks to several (the main API and the
                 * CMS manage, read and preview endpoints) and knowing which one produced an entry is
                 * most of the context when reading a report.
                 */
                url: request.path
            };

            await this.debuggerService.flush(target);
        } catch (ex) {
            /**
             * Only the message, never the session or the payload.
             */
            this.logger.error({ error: describeError(ex) }, "Debugger failed to flush.");
            this.debuggerService.discard();
        }
    }
}

export const DebuggerRouteDecorator = HttpRouteHandler.createDecorator({
    decorator: DebuggerRouteDecoratorImpl,
    dependencies: [Debugger, IdentityContext, Logger, [RequestId, { optional: true }]]
});
