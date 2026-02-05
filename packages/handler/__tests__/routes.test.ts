import { describe, expect, it } from "vitest";
import { createHandler, RoutePlugin } from "~/index";
import { DefinedContextRoutes } from "~/types";

describe("route plugins", () => {
    it("should add routes and they must be visible in the defined property", async () => {
        const routes = new RoutePlugin(
            async ({ onPost, onGet, onDelete, onOptions, onPatch, onPut, onAll, onHead }) => {
                onPost("/webiny-post", async () => {
                    throw new Error("This should not fire!");
                });

                onGet("/webiny-get", async () => {
                    throw new Error("This should not fire!");
                });

                onDelete("/webiny-delete", async () => {
                    throw new Error("This should not fire!");
                });

                onOptions("/webiny-options", async () => {
                    throw new Error("This should not fire!");
                });

                onPatch("/webiny-patch", async () => {
                    throw new Error("This should not fire!");
                });

                onPut("/webiny-put", async () => {
                    throw new Error("This should not fire!");
                });
                onHead("/webiny-head", async () => {
                    throw new Error("This should not fire!");
                });
                onAll("/webiny-all", async () => {
                    throw new Error("This should not fire!");
                });
            }
        );

        const app = createHandler({
            plugins: [routes]
        });

        expect(app).not.toBeNull();

        const expected: DefinedContextRoutes = {
            PUT: ["/webiny-put", "/webiny-all"],
            PATCH: ["/webiny-patch", "/webiny-all"],
            POST: ["/webiny-post", "/webiny-all"],
            GET: ["/webiny-get", "/webiny-all"],
            DELETE: ["/webiny-delete", "/webiny-all"],
            OPTIONS: ["/webiny-options", "/webiny-all"],
            HEAD: ["/webiny-get", "/webiny-head", "/webiny-all"],
            TRACE: ["/webiny-all"],
            UNLOCK: [],
            REPORT: [],
            SEARCH: [],
            LOCK: [],
            MOVE: [],
            PROPPATCH: [],
            COPY: [],
            PROPFIND: [],
            MKCOL: [],
            MKCALENDAR: []
        };

        const defined = app.webiny.routes.defined;

        expect(defined).toEqual(expected);
    });
});
