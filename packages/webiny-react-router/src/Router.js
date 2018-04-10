// @flow
import invariant from "invariant";
import compose from "webiny-compose";
import debugFactory from "debug";
import pathToRegExp from "path-to-regexp";
import _ from "lodash";
import qs from "query-string";
import { createBrowserHistory } from "history";
import matchPath from "./utils/matchPath";
import generatePath from "./utils/generatePath";
import sortRoutes from "./utils/sortRoutes";
import parseBoolean from "./utils/parseBoolean";

const debug = debugFactory("webiny-react-router");

declare type Route = {
    name: string,
    path: string
} & Object;

class Router {
    config: {
        history: any,
        basename: string,
        middleware: Array<Function>
    };
    history: any;
    middleware: Function;
    routes: Array<Route>;
    match: {
        path: string,
        url: string,
        isExact: boolean,
        params: Object,
        query: Object
    };
    route: Route;

    constructor() {
        this.routes = [];
    }

    configure(config: Object) {
        this.config = { ...config };
        this.history = config.history;
        this.middleware = compose(config.middleware);

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

    getParams(name: ?string = null): mixed {
        return name ? this.match.params[name] : this.match.params;
    }

    getQuery(name: ?string = null) {
        return name ? this.match.query[name] : this.match.query;
    }

    getRoute(name: string) {
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
            parseBoolean(match.query);

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
