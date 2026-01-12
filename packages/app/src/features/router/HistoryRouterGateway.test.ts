import { describe, it, beforeEach, expect, vi } from "vitest";
import { createMemoryHistory } from "history";
import { HistoryRouterGateway } from "./HistoryRouterGateway.js";
import { generateUrl } from "./generateUrl.js";

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
            generateUrl("/"),
            generateUrl("/login", {}),
            generateUrl("/login", { redirect: "/", reason: "login" }),
            generateUrl("/dynamic-route/:name", { name: "cars" })
        ];
        expect(urls).toEqual([
            "/",
            "/login",
            "/login?redirect=%2F&reason=login",
            "/dynamic-route/cars"
        ]);
    });
});
