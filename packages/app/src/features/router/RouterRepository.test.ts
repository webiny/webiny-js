import { describe, it, beforeEach, expect, vi } from "vitest";
import { createMemoryHistory } from "history";
import { HistoryRouterGateway } from "./HistoryRouterGateway.js";
import { RouterRepository } from "./RouterRepository.js";
import { Route } from "./Route.js";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

const loginRouteDef = new Route({ name: "login", path: "/login" });

const userRouteDef = new Route({
    name: "userById",
    path: "/users/:id",
    params: zod => {
        return {
            id: zod.string()
        };
    }
});

const allRoutes: Route<any>[] = [
    new Route({ name: "home", path: "/" }),
    loginRouteDef,
    userRouteDef
];

const loginRoute = {
    name: "login",
    path: "/login",
    pathname: "/login",
    params: {}
};

const userRoute = (id: string) => {
    return {
        name: "userById",
        path: "/users/:id",
        pathname: `/users/${id}`,
        params: {
            id
        }
    };
};

const createRepository = (routes = allRoutes) => {
    const history = createMemoryHistory();
    history.replace("/__unknown__");

    const gateway = new HistoryRouterGateway(history, "");
    const repository = new RouterRepository(gateway);

    repository.registerRoutes(routes);

    return { repository, history };
};

describe("Router Repository", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("state should contain current route", async () => {
        const { repository, history } = createRepository();
        history.push("/login");
        await wait();

        expect(repository.getMatchedRoute()).toEqual(loginRoute);
    });

    it("transition guard should block route transition", async () => {
        const { repository, history } = createRepository();
        history.push("/login");
        await wait();

        // This guard should prevent the transition.
        const onBlocked = vi.fn();
        repository.addGuard({
            guard: () => true,
            onBlocked
        });

        // Trigger a history location change (imagine a click on "Back" button in the browser).
        history.push("/users/123");
        await wait();

        expect(repository.getMatchedRoute()).toEqual(loginRoute);
        expect(onBlocked).toHaveBeenCalledTimes(1);
    });

    it("transition guard should allow route transition when guard returns false", async () => {
        const { repository, history } = createRepository();
        history.push("/login");
        await wait();

        repository.addGuard({
            guard: () => false,
            onBlocked: vi.fn()
        });

        // Trigger a history location change.
        history.push("/users/123");
        await wait();

        expect(repository.getMatchedRoute()).toEqual(userRoute("123"));
    });

    it("confirmTransition should allow a blocked transition to proceed", async () => {
        const { repository, history } = createRepository();
        history.push("/login");
        await wait();

        repository.addGuard({
            guard: () => true,
            onBlocked: () => {
                repository.confirmTransition();
            }
        });

        history.push("/users/123");
        await wait();

        expect(repository.getMatchedRoute()).toEqual(userRoute("123"));
    });

    it("guard disposer should remove the guard", async () => {
        const { repository, history } = createRepository();
        history.push("/login");
        await wait();

        const dispose = repository.addGuard({
            guard: () => true,
            onBlocked: vi.fn()
        });

        // Remove the guard.
        dispose();

        // Transition should now pass through.
        history.push("/users/123");
        await wait();

        expect(repository.getMatchedRoute()).toEqual(userRoute("123"));
    });

    it("should go to the right route", async () => {
        const { repository } = createRepository();
        repository.goToRoute(userRouteDef, { id: "5" });
        await wait();
        expect(repository.getMatchedRoute()).toEqual(userRoute("5"));
    });

    it("should generate a valid route link", async () => {
        const { repository } = createRepository();

        expect(repository.getLink(loginRouteDef)).toEqual("/login");
        expect(repository.getLink(userRouteDef, { id: "1" })).toEqual("/users/1");
    });

    it("should generate a valid route link when no routes are registered", async () => {
        const { repository } = createRepository([]);

        expect(repository.getLink(loginRouteDef)).toEqual("/login");
        expect(repository.getLink(userRouteDef, { id: "1" })).toEqual("/users/1");
    });
});
