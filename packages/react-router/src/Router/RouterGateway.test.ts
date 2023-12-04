import { UniversalRouterGateway } from "~/Router/UniversalRouterGateway";

describe("Router Gateway", () => {
    it("should register and match routes", async () => {
        const gateway = new UniversalRouterGateway("");
        gateway.registerRoutes([{ path: "/" }, { path: "/login" }]);

        const loginRoute = await gateway.matchRoute("/login");

        expect(loginRoute).toEqual({
            path: "/login",
            pathname: "/login",
            params: {}
        });

        const indexRoute = await gateway.matchRoute("/");
        expect(indexRoute).toEqual({
            path: "/",
            pathname: "/",
            params: {}
        });

        const missingRoute = await gateway.matchRoute("/not-found");
        expect(missingRoute).toBe(undefined);

        gateway.registerRoutes([{ path: "/dynamic-route/:name" }]);

        const dynamicRoute = await gateway.matchRoute("/dynamic-route/content-model");
        expect(dynamicRoute).toEqual({
            path: "/dynamic-route/:name",
            pathname: "/dynamic-route/content-model",
            params: {
                name: "content-model"
            }
        });
    });

    it("should generate route URLs", async () => {
        const gateway = new UniversalRouterGateway("");
        gateway.registerRoutes([
            { name: "root", path: "/" },
            { name: "login", path: "/login" },
            { name: "dynamic", path: "/dynamic-route/:name" }
        ]);

        const urls = [
            gateway.generateRouteUrl("root"),
            gateway.generateRouteUrl("login"),
            gateway.generateRouteUrl("login", { redirect: "/", reason: "login" }),
            gateway.generateRouteUrl("dynamic", { name: "cars" })
        ];
        expect(urls).toEqual([
            "/",
            "/login",
            "/login?redirect=%2F&reason=login",
            "/dynamic-route/cars"
        ]);
    });
});
