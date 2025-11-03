import { makeAutoObservable, toJS } from "mobx";
import { createImplementation } from "@webiny/di";
import { Route } from "./Route.js";
import {
    RouterRepository,
    RouterPresenter as Abstraction,
    type OnRouteExit
} from "./abstractions.js";

class RouterPresenterImpl implements Abstraction.Interface {
    private routerRepository: RouterRepository.Interface;

    constructor(routerRepository: RouterRepository.Interface) {
        this.routerRepository = routerRepository;

        makeAutoObservable(this);
    }

    get vm() {
        return {
            currentRoute: toJS(this.routerRepository.getMatchedRoute())
        };
    }

    bootstrap = (routes: Route[]) => {
        this.routerRepository.registerRoutes(routes);
    };

    goToRoute = (route: any, params?: any) => {
        this.routerRepository.goToRoute(route, params);
    };

    setRouteParams = (cb: any) => {
        const currentRoute = this.routerRepository.getCurrentRoute();
        if (!currentRoute) {
            return;
        }

        const matchedRoute = this.routerRepository.getMatchedRoute();
        const newParams = cb(matchedRoute?.params ?? {});
        this.goToRoute(currentRoute, newParams);
    };

    getLink = (route: any, params?: any) => {
        return this.routerRepository.getLink(route, params);
    };

    onRouteExit = (cb: OnRouteExit) => {
        this.routerRepository.onRouteExit(cb);
    };

    destroy = () => {
        this.routerRepository.destroy();
    };
}

export const RouterPresenter = createImplementation({
    abstraction: Abstraction,
    implementation: RouterPresenterImpl,
    dependencies: [RouterRepository]
});
