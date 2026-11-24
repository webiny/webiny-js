import { TestHttpInputHandler } from "./TestHttpInputHandler.js";
import { HttpRouter, RouteNotFoundError } from "~/features/http/abstractions.js";
import type { InputContext } from "~/features/kernel/InputHandler.js";
import type { NextFunction } from "~/features/kernel/types.js";
import type { IHttpRouter } from "~/features/http/abstractions.js";

class HttpRouterHandlerImpl implements TestHttpInputHandler.Interface {
    constructor(private router: IHttpRouter) {}

    async execute(ctx: InputContext, _next: NextFunction): Promise<any> {
        try {
            return await this.router.route(ctx.input);
        } catch (e) {
            if (e instanceof RouteNotFoundError) {
                return { statusCode: 404, body: { message: e.message } };
            }
            // Propagate structured errors (e.g. WebinyError with code/data) for test visibility
            if (e && typeof e === "object" && (e as any).code) {
                return {
                    statusCode: 500,
                    body: {
                        message: (e as any).message,
                        code: (e as any).code,
                        data: (e as any).data ?? null
                    }
                };
            }
            return { statusCode: 500, body: { message: "Internal server error" } };
        }
    }
}

export const HttpRouterHandler = TestHttpInputHandler.createImplementation({
    implementation: HttpRouterHandlerImpl,
    dependencies: [HttpRouter]
});
