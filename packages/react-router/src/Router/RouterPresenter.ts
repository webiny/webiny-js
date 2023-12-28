import { makeAutoObservable, toJS } from "mobx";
import {
    IRouterRepository,
    RouteDefinition,
    RouteParams
} from "~/Router/abstractions/IRouterRepository";

export class RouterPresenter {
    private routerRepository: IRouterRepository;

    constructor(routerRepository: IRouterRepository) {
        this.routerRepository = routerRepository;

        makeAutoObservable(this);
    }

    get vm() {
        return {
            currentRoute: toJS(this.routerRepository.getCurrentRoute())
        };
    }

    bootstrap(routes: RouteDefinition[]) {
        console.log("bootstrap", routes);
        this.routerRepository.registerRoutes(
            routes.map(route => ({ name: route.name, path: route.path }))
        );
    }

    goToRoute = async (name: string, params?: RouteParams) => {
        this.routerRepository.goToRoute(name, params);
    };
}
