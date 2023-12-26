import {
    IRouterRepository,
    RouteDefinition,
    RouteParams
} from "~/Router/abstractions/IRouterRepository";

export class RouterPresenter {
    private routerRepository: IRouterRepository;

    constructor(routerRepository: IRouterRepository) {
        this.routerRepository = routerRepository;
    }

    get vm() {
        return this.routerRepository.getCurrentRoute();
    }

    bootstrap(routes: RouteDefinition[]) {
        this.routerRepository.registerRoutes(
            routes.map(route => ({ name: route.name, path: route.path }))
        );
    }

    goToRoute = async (name: string, params?: RouteParams) => {
        this.routerRepository.goToRoute(name, params);
    };
}
