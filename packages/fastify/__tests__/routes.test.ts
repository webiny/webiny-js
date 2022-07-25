import { createFastify, RoutePlugin } from "~/index";
import { RouteTypes } from "~/types";

describe("Fastify routes plugin", () => {
    it("should add routes and they must be visible in the defined property", async () => {
        const routes = new RoutePlugin(
            async ({ onPost, onGet, onDelete, onOptions, onPatch, onPut, onAll }) => {
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
                onAll("/webiny-all", async () => {
                    throw new Error("This should not fire!");
                });
            }
        );

        const app = createFastify({
            plugins: [routes]
        });

        expect(app).not.toBeNull();

        const expected: Record<RouteTypes, string[]> = {
            put: ["/webiny-put"],
            patch: ["/webiny-patch"],
            post: ["/webiny-post"],
            get: ["/webiny-get"],
            delete: ["/webiny-delete"],
            options: ["/webiny-options"],
            all: ["/webiny-all"]
        };

        expect(app.webiny.routes.defined).toEqual(expected);
    });
});
