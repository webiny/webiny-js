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
import type { Route, RouterConfig, GoToRouteOptions } from "webiny-react-router/types";

const debug = debugFactory("webiny-react-router");

class Router {
    config: RouterConfig;
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

    goToRoute(options: GoToRouteOptions) {
        const route = options.name ? _.find(this.routes, { name: options.name }) : this.route;
        const params = options.merge
            ? { ...this.getParams(), ...this.getQuery(), ...options.params }
            : options.params;

        options.name && invariant(route, `Route "${options.name}" does not exist!`);

        const path = generatePath((this.config.basename || "") + route.path, params);

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

    async renderDefaultRoute() {
        const defaultRoute = this.routes.find(r => r.name === this.config.defaultRoute);

        if (defaultRoute) {
            this.route = defaultRoute;
            this.match = {
                path: defaultRoute.path,
                url: defaultRoute.path,
                isExact: true,
                params: {},
                query: {}
            };
            const params = { route: defaultRoute, output: null, match: this.match };
            await this.middleware(params);

            return params.output;
        }

        return null;
    }

    async matchRoute(pathname: string) {
        debug("Matching location %o", pathname);
        let route = null;
        const { basename = "/" } = this.config;
        if (basename !== "/" && pathname.startsWith(basename)) {
            pathname = pathname.substring(basename.length);
        }

        if (pathname === "") {
            pathname = "/";
        }

        sortRoutes(this.routes);

        for (let i = 0; i < this.routes.length; i++) {
            route = _.cloneDeep(this.routes[i]);
            const match = matchPath(pathname, {
                path: route.path,
                exact: route.hasOwnProperty("exact") ? route.exact : true
            });

            if (!match) {
                continue;
            }

            match.query = qs.parse(this.history.location.search);
            parseBoolean(match.query);

            if (route.route) {
                route = _.merge(route, _.find(this.routes, { name: route.route }));
            }

            this.route = route;
            this.match = match;

            const params = { route, output: null, match };
            await this.middleware(params);

            return params.output;
        }

        return await this.renderDefaultRoute();
    }
}

export { Router };
