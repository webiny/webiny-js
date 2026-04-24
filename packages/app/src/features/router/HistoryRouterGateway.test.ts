import { describe, it, beforeEach, expect, vi } from "vitest";
import { createMemoryHistory } from "history";
import { HistoryRouterGateway } from "./HistoryRouterGateway.js";
import { RouteUrl } from "./RouteUrl.js";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

describe("Router Gateway", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should execute onMatch when history changes", async () => {
        const spyHome = vi.fn();
        const spyLogin = vi.fn();
        const spyDynamic = vi.fn();

        // Create `history` and set the initial pathname to an unknown route
        const history = createMemoryHistory();
        history.replace("/__unknown__");

        const gateway = new HistoryRouterGateway(history, "");
        gateway.setRoutes([
            { name: "home", path: "/", onMatch: spyHome },
            { name: "login", path: "/login", onMatch: spyLogin },
            { name: "test", path: "/dynamic-route/:name", onMatch: spyDynamic }
        ]);

        history.push("/login");
        await wait();
        history.push("/");
        await wait();
        history.push("/dynamic-route/cars");
        await wait();
        history.push("/login");
        await wait();
        history.push("/dynamic-route/blogs");
        await wait();
        history.push("/dynamic-route/blogs?search=123");
        await wait();

        expect(spyLogin).toHaveBeenCalledTimes(2);
        expect(spyLogin).toHaveBeenNthCalledWith(1, {
            name: "login",
            path: "/login",
            pathname: "/login",
            params: {}
        });
        expect(spyLogin).toHaveBeenNthCalledWith(2, {
            name: "login",
            path: "/login",
            pathname: "/login",
            params: {}
        });
        expect(spyHome).toHaveBeenCalledTimes(1);
        expect(spyHome).toHaveBeenLastCalledWith({
            name: "home",
            path: "/",
            pathname: "/",
            params: {}
        });
        expect(spyDynamic).toHaveBeenCalledTimes(3);
        expect(spyDynamic).toHaveBeenNthCalledWith(1, {
            name: "test",
            path: "/dynamic-route/:name",
            pathname: "/dynamic-route/cars",
            params: {
                name: "cars"
            }
        });
        expect(spyDynamic).toHaveBeenNthCalledWith(2, {
            name: "test",
            path: "/dynamic-route/:name",
            pathname: "/dynamic-route/blogs",
            params: {
                name: "blogs"
            }
        });
        expect(spyDynamic).toHaveBeenNthCalledWith(3, {
            name: "test",
            path: "/dynamic-route/:name",
            pathname: "/dynamic-route/blogs",
            params: {
                name: "blogs",
                search: "123"
            }
        });
    });

    it("should generate route URLs", async () => {
        const urls = [
            RouteUrl.fromPattern("/"),
            RouteUrl.fromPattern("/login", {}),
            RouteUrl.fromPattern("/login", { redirect: "/", reason: "login" }),
            RouteUrl.fromPattern("/dynamic-route/:name", { name: "cars" }),
            RouteUrl.fromPattern("/dynamic-route", { folderId: "696556831e485d00027a1a0b#0001" })
        ];
        expect(urls).toEqual([
            "/",
            "/login",
            "/login?redirect=%2F&reason=login",
            "/dynamic-route/cars",
            "/dynamic-route?folderId=696556831e485d00027a1a0b%230001"
        ]);
    });

    it("should handle baseUrl for route matching and URL generation", async () => {
        const spyFileManager = vi.fn();
        const spyHome = vi.fn();

        // Create history with a tenant prefix
        const history = createMemoryHistory();
        history.replace("/tenant123/__unknown__");

        const gateway = new HistoryRouterGateway(history, "/tenant123");
        gateway.setRoutes([
            { name: "home", path: "/", onMatch: spyHome },
            { name: "fileManager", path: "/file-manager", onMatch: spyFileManager }
        ]);

        // Navigate to /tenant123/file-manager
        history.push("/tenant123/file-manager");
        await wait();

        // Should match the /file-manager route
        expect(spyFileManager).toHaveBeenCalledTimes(1);
        expect(spyFileManager).toHaveBeenCalledWith({
            name: "fileManager",
            path: "/file-manager",
            pathname: "/tenant123/file-manager",
            params: {}
        });

        // Test URL generation with baseUrl
        const urlWithBase = RouteUrl.fromPattern("/file-manager", {}, "/tenant123");
        expect(urlWithBase).toBe("/tenant123/file-manager");

        const urlWithBaseAndParams = RouteUrl.fromPattern(
            "/file-manager",
            { folder: "abc" },
            "/tenant123"
        );
        expect(urlWithBaseAndParams).toBe("/tenant123/file-manager?folder=abc");
    });

    it("should properly sort routes with wildcards always at the bottom", async () => {
        const spyWildcard = vi.fn();
        const spySpecific = vi.fn();
        const spyHome = vi.fn();

        const history = createMemoryHistory();
        // Start at a non-matching path to avoid initial route resolution
        history.replace("/initial");

        const gateway = new HistoryRouterGateway(history, "");

        // Add wildcard first, then home route
        // Note: setRoutes will trigger route resolution for current path (/initial)
        gateway.setRoutes([
            { name: "wildcard", path: "*", onMatch: spyWildcard },
            { name: "home", path: "/", onMatch: spyHome }
        ]);

        // Wildcard should have matched /initial
        expect(spyWildcard).toHaveBeenCalledTimes(1);
        vi.clearAllMocks();

        // Now add a specific route after the wildcard - this should re-sort and keep wildcard at bottom
        // Note: setRoutes will trigger route resolution again for /initial, matching wildcard again
        gateway.setRoutes([{ name: "specific", path: "/specific-route", onMatch: spySpecific }]);

        // Wildcard should match /initial again after re-sorting
        expect(spyWildcard).toHaveBeenCalledTimes(1);
        vi.clearAllMocks();

        // Navigate to the specific route
        history.push("/specific-route");
        await wait();

        // Should match the specific route, not the wildcard
        expect(spySpecific).toHaveBeenCalledTimes(1);
        expect(spyWildcard).toHaveBeenCalledTimes(0);
        expect(spyHome).toHaveBeenCalledTimes(0);

        // Navigate to home
        history.push("/");
        await wait();

        // Should match home route
        expect(spyHome).toHaveBeenCalledTimes(1);
        expect(spyWildcard).toHaveBeenCalledTimes(0);

        // Navigate to unknown route
        history.push("/unknown");
        await wait();

        // Should match wildcard
        expect(spyWildcard).toHaveBeenCalledTimes(1);
    });
});
