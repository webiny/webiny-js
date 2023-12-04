import { RouterGateway } from "~/Router/RouterGateway.interface";

interface Route {
    // Pathname that was used to match the route.
    pathname: string;
    // Path pattern that matched this route.
    path: string;
    // Route params extracted from the pathname.
    params: Record<string, any>;
    queryParams: Record<string, any>;
}

export class RouterRepository {
    private gateway: RouterGateway;
    private currentRoute: Route;

    constructor(gateway: RouterGateway) {
        this.gateway = gateway;
    }
}
