import { HistoryRouterGateway } from "~/Router/HistoryRouterGateway";
import { createMemoryHistory } from "history";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

describe("Router Gateway", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should execute onMatch when history changes", async () => {
        const spyHome = jest.fn();
        const spyLogin = jest.fn();
        const spyDynamic = jest.fn();

        const history = createMemoryHistory();
        const gateway = new HistoryRouterGateway(history, "");
        gateway.registerRoutes([
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
        expect(spyDynamic).toHaveBeenCalledTimes(2);
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
    });

    it("should generate route URLs", async () => {
        const spyHome = jest.fn();
        const spyLogin = jest.fn();
        const spyDynamic = jest.fn();

        const history = createMemoryHistory();
        const gateway = new HistoryRouterGateway(history, "");
        gateway.registerRoutes([
            { name: "root", path: "/", onMatch: spyHome },
            { name: "login", path: "/login", onMatch: spyLogin },
            { name: "dynamic", path: "/dynamic-route/:name", onMatch: spyDynamic }
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
