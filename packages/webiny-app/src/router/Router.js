import invariant from "invariant";
import compose from "webiny-compose";
import debugFactory from "debug";
import pathToRegExp from "path-to-regexp";
import _ from "lodash";
import qs from "query-string";
import { createBrowserHistory } from "history";
import Route from "./Route.cmp";
import matchPath from "./matchPath";
import generatePath from "./generatePath";
import sortRoutes from "./sortRoutes";

const debug = debugFactory("webiny-app:router");

class Router {
    config: {
        history: any,
        basename: string,
        middleware: Array<Function>
    };
    middleware: Function;
    routes: Array<Route>;
    match: Object;
    route: Object;

    constructor() {
        this.routes = [];
    }

    configure(config: Object) {
        this.config = { ...config };
        this.history = config.history;
        this.middleware = compose(config.middleware);
        this.match = null;

        if (!this.history) {
            this.history = createBrowserHistory();
        }
    }

    addRoute(route: Route) {
        route.params = [];
        pathToRegExp(route.path, route.params);
        this.routes.push(route);
    }

    goToRoute(name: string, params: {}) {
        const route = name === "current" ? this.route : _.find(this.routes, { name });
        invariant(route, `Route "${name}" does not exist!`);
        const path = generatePath(route.path, params);

        this.history.push(path);
    }

    createHref(name: string, params?: Object) {
        const route = _.find(this.routes, { name });
        return generatePath((this.config.basename || "") + route.path, params);
    }

    getParams(name = null) {
        return name ? this.match.params[name] : this.match.params;
    }

    getQuery(name = null) {
        return name ? this.match.query[name] : this.match.query;
    }

    getRoute(name) {
        return _.find(this.routes, { name });
    }

    async matchRoute(pathname: string) {
        debug("Matching location %o", pathname);
        let route = null;
        if (pathname.startsWith(this.config.basename)) {
            pathname = pathname.substring(this.config.basename.length);
        }

        if (pathname === "") {
            pathname = "/";
        }

        sortRoutes(this.routes);

        for (let i = 0; i < this.routes.length; i++) {
            route = _.cloneDeep(this.routes[i]);
            const match = matchPath(pathname, {
                path: route.path,
                exact: route.exact
            });

            if (!match) {
                continue;
            }

            match.query = qs.parse(this.history.location.search);

            this.route = route;
            this.match = match;

            const params = { route, output: null, match };
            await this.middleware(params);

            return params.output;
        }

        return route;
    }
}

export default Router;
