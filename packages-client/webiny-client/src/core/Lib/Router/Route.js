import React from "react";
import _ from "lodash";
import $ from "jquery";
import { Webiny } from "./../../../index";
import Router from "./Router";

class Route {
    constructor(name, pattern, components, title = "") {
        this.name = name;
        this.pattern = pattern;
        this.components = Route.normalizeComponents(components);
        this.title = title;
        this.paramNames = [];
        this.paramValues = {};

        // Extract params names
        const params = pattern.match(this.namedParam);
        if (params) {
            params.forEach(item => {
                this.paramNames.push(item.replace(":", ""));
            });
        }

        const splatParams = pattern.match(this.splatParam);
        if (splatParams) {
            splatParams.forEach(item => {
                this.paramNames.push(item.replace("*", ""));
            });
        }

        // Build route regex
        const regex = pattern.replace(this.namedParam, "([^/]+)").replace(this.splatParam, "(.*?)");
        this.regex = new RegExp("^" + regex + "$");
    }

    match(url) {
        if (!this.regex.test(url)) {
            return false;
        }

        // Url params
        this.paramValues = {};
        if (this.paramNames) {
            const matchedParams = url.match(this.regex);
            if (matchedParams) {
                matchedParams.shift();
                matchedParams.forEach((value, index) => {
                    this.paramValues[this.paramNames[index]] = value;
                });
            }
        }

        // Parse query string params
        _.merge(this.paramValues, $.deparam(Router.history.location.search.substring(1)));

        return true;
    }

    getName() {
        return this.name;
    }

    /**
     *
     * @param params
     * @param pattern
     * @returns {*}
     */
    getHref(params = null, pattern = null) {
        let url = pattern || this.pattern;

        const newParams = params || {};

        _.forEach(newParams, (value, key) => {
            if (value === null) {
                delete newParams[key];
            }
        });

        // Build main URL
        this.paramNames.forEach(param => {
            url = url.replace(":" + param, newParams[param]);
            delete newParams[param];
        });

        // Build query string from the remaining params
        if (Object.keys(newParams).length > 0) {
            url += "?" + $.param(newParams);
        }

        return _.trimEnd(Router.getBaseUrl(), "/") + url;
    }

    getPattern() {
        return this.pattern;
    }

    getTitle() {
        return this.title;
    }

    setTitle(title) {
        this.title = title;
        return this;
    }

    getParams(name = null) {
        if (name) {
            if (_.isUndefined(this.paramValues[name])) {
                return null;
            }
            return this.paramValues[name];
        }
        return this.paramValues;
    }

    getQueryParams(name = null) {
        const queryParams = _.omit(this.getParams(), this.paramNames);
        if (name) {
            if (_.isUndefined(queryParams[name])) {
                return null;
            }
            return queryParams[name];
        }
        return queryParams;
    }

    async getComponents() {
        // Check if there are any components that are actually functions (they may possibly have dynamic imports)
        const dynamic = [];
        const output = {};

        let components = this.components;
        if (_.isFunction(components)) {
            components = await components();
            components = Route.normalizeComponents(components);
        }

        if (_.isFunction(components)) {
            output["Content"] = components;
        }

        _.each(components, (component, placeholder) => {
            if (_.isFunction(component) && !(component.prototype instanceof Webiny.Ui.Component)) {
                dynamic.push(
                    Promise.resolve(component()).then(module => {
                        output[placeholder] = module;
                    })
                );
            } else {
                output[placeholder] = component;
            }
        });

        await Promise.all(dynamic);

        return output;
    }

    skipDefaultComponents(flag = null) {
        if (flag === null) {
            return this.skipDefaults;
        }

        this.skipDefaults = flag;
        return this;
    }

    setModule(module) {
        this.module = module;
        return this;
    }

    getModule() {
        return this.module;
    }

    setRole(role) {
        if (_.isString(role)) {
            role = role.split(",");
        }
        this.role = role;
        return this;
    }

    setLayout(name) {
        this.layout = name;
        return this;
    }

    /**
     * When passing components, they can be passed as:
     * - a function - where placeholder names and React components are about to be returned when it's resolved (called and again normalized upon route match)
     * - a single React component - which will be assigned to 'Content' placeholder automatically
     * - a JSON object - which contains several placeholder names as keys and React components or (a)sync functions as values
     */
    static normalizeComponents(components) {
        if (!components) {
            return components;
        }

        if (
            components.prototype instanceof Webiny.Ui.Component ||
            React.isValidElement(components)
        ) {
            return { Content: components };
        }

        return components;
    }
}

Route.prototype.layout = "default";
Route.prototype.module = false;
Route.prototype.namedParam = /:\w+/g;
Route.prototype.splatParam = /\*\w+/g;
Route.prototype.skipDefaults = false;

export default Route;
