// @flow
import _ from "lodash";
import ApiMethod from "./apiMethod";
import { Endpoint } from "./../endpoint";
import MatchedApiMethod from "./matchedApiMethod";

type ApiMethods = {
    [name: string]: ApiMethod
};

class ApiContainer {
    context: Endpoint;
    apiMethods: ApiMethods;

    constructor(context: Endpoint) {
        this.apiMethods = {};
        this.context = context;
    }

    api(name: string, httpMethod: string, pattern: string, callable?: Function): ?ApiMethod {
        if (!pattern.startsWith("/")) {
            pattern = "/" + pattern;
        }

        let apiInstance: ApiMethod;
        if (callable) {
            if (_.has(this.apiMethods, name)) {
                apiInstance = this.apiMethods[name];
            } else {
                apiInstance = new ApiMethod(name, httpMethod, pattern, this.context);
            }

            apiInstance.addCallback(callable);
            this.apiMethods[name] = apiInstance;
        } else {
            apiInstance = this.apiMethods[name] || null;
        }

        return apiInstance;
    }

    extend(name: string, fn: Function): ApiMethod {
        const apiMethod = this.apiMethods[name];
        if (!apiMethod) {
            throw new Error(`Method ${name} doesn't exist!`);
        }
        apiMethod.addCallback(fn);
        return apiMethod;
    }

    get(name: string, pattern: string, fn?: Function): ?ApiMethod {
        return this.api(name, "get", pattern, fn);
    }

    post(name: string, pattern: string, fn?: Function): ?ApiMethod {
        return this.api(name, "post", pattern, fn);
    }

    patch(name: string, pattern: string, fn?: Function): ?ApiMethod {
        return this.api(name, "patch", pattern, fn);
    }

    delete(name: string, pattern: string, fn?: Function): ?ApiMethod {
        return this.api(name, "delete", pattern, fn);
    }

    removeMethod(name: string): void {
        delete this.apiMethods[name];
    }

    getMethods(): ApiMethods {
        return this.apiMethods;
    }

    getMethod(name: string): ?ApiMethod {
        return this.apiMethods[name];
    }

    matchMethod(httpMethod: string, url: string): ?MatchedApiMethod {
        httpMethod = httpMethod.toLowerCase();
        let matched = null;

        const methods: Array<ApiMethod> = [];
        Object.values(this.apiMethods).map(m => {
            const method = ((m: any): ApiMethod);
            if (method.httpMethod === httpMethod) {
                methods.push(method);
            }
        });

        const length = arr => arr.filter(v => !_.isEmpty(v)).length;

        methods.sort((methodA: any, methodB: any) => {
            // 1 means 'a' goes after 'b'
            // -1 means 'a' goes before 'b'

            const a: string = methodA.getPattern();
            const b: string = methodB.getPattern();

            if (a.startsWith("/:") && !b.startsWith("/:")) {
                return 1;
            }

            const al = length(a.split("/"));
            const bl = length(b.split("/"));
            let position = al !== bl ? (al > bl ? -1 : 1) : 0;

            if (position !== 0) {
                return position;
            }

            // Compare number of variables
            const av = length(a.match(/:|\*/g) || []);
            const bv = length(b.match(/:|\*/g) || []);
            return av !== bv ? (av > bv ? 1 : -1) : 0;
        });

        _.each(methods, (apiMethod: ApiMethod) => {
            if (!apiMethod.getRegex().test(url)) {
                return;
            }

            const paramValues = {};
            if (apiMethod.paramNames) {
                const matchedParams = url.match(apiMethod.getRegex());
                if (matchedParams) {
                    matchedParams.shift();
                    matchedParams.forEach((value, index) => {
                        paramValues[apiMethod.paramNames[index]] = value;
                    });
                }
            }

            matched = new MatchedApiMethod(apiMethod, paramValues);
            return false;
        });

        return matched;
    }
}

export default ApiContainer;
