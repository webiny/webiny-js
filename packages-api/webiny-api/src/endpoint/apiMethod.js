// @flow
import _ from "lodash";
import type { Endpoint } from "./../endpoint";

class ApiMethod {
    name: string;
    httpMethod: string;
    context: Endpoint;
    pattern: string;
    callbacks: Array<Function>;
    regex: RegExp;
    namedParam: RegExp;
    wildcardParam: RegExp;
    paramNames: Array<string>;

    constructor(name: string, httpMethod: string, pattern: string, context: Endpoint) {
        this.name = name;
        this.httpMethod = httpMethod;
        this.context = context;
        this.pattern = pattern.startsWith("/") ? pattern : "/" + pattern;
        this.callbacks = [];
        this.namedParam = /:\w+/g;
        this.wildcardParam = /\*\w+/g;
        this.paramNames = [];

        // Extract params names
        const params = pattern.match(this.namedParam);
        if (params) {
            params.forEach(item => {
                this.paramNames.push(item.replace(":", ""));
            });
        }

        const wildcardParams = pattern.match(this.wildcardParam);
        if (wildcardParams) {
            wildcardParams.forEach(item => {
                this.paramNames.push(item.replace("*", ""));
            });
        }

        // Build route regex
        const regex = pattern
            .replace(this.namedParam, "([^/]+)")
            .replace(this.wildcardParam, "(.*?)");
        this.regex = new RegExp("^" + regex + "$");
    }

    getName(): string {
        return this.name;
    }

    getEndpoint(): Endpoint {
        return this.context;
    }

    getPattern(): string {
        return this.pattern;
    }

    getRegex(): RegExp {
        return this.regex;
    }

    exec(req: express$Request, res: express$Response, params: Object, context: Endpoint) {
        if (this.httpMethod === "post" || this.httpMethod === "patch") {
            // TODO: this.validateBody(req.body);
        }

        const callback = this.callbacks[0].bind(context);
        const callbackCount = this.callbacks.length;

        params.req = req;
        params.res = res;

        let parent = _.noop;
        if (callbackCount > 1) {
            parent = this.createParent(1, context);
        }

        return callback(params, parent);
    }

    addCallback(callable: Function) {
        this.callbacks.unshift(callable);
    }

    createParent(index: number, bindTo: Endpoint) {
        const $this = this;
        return function(...params: Array<any>) {
            let callback = $this.callbacks[index];
            if ($this.callbacks.length > index + 1) {
                params.push($this.createParent(index + 1, bindTo));
            }

            callback = callback.bind(bindTo);

            return callback(...params);
        };
    }
}

export default ApiMethod;
