// @flow
import _ from 'lodash';
import ApiMethod from './apiMethod';
import { Endpoint } from './../endpoint';
import MatchedApiMethod from './matchedApiMethod';

type ApiMethods = {
    [key: string]: { [key: string]: ApiMethod };
}

class ApiContainer {
    context: Endpoint;
    apiMethods: ApiMethods;

    constructor(context: Endpoint) {
        this.apiMethods = {};
        this.context = context;
    }

    api(httpMethod: string, pattern: string, callable?: Function): ?ApiMethod {
        if (!pattern.startsWith('/')) {
            pattern = '/' + pattern;
        }

        httpMethod = httpMethod.toLowerCase();

        if (callable && !_.has(this.apiMethods, httpMethod)) {
            this.apiMethods[httpMethod] = {};
        }

        let apiInstance: ApiMethod;
        if (callable) {
            if (_.has(this.apiMethods, [httpMethod, pattern])) {
                apiInstance = this.apiMethods[httpMethod][pattern];
            } else {
                apiInstance = new ApiMethod(httpMethod, pattern, this.context);
            }

            apiInstance.addCallback(callable);
            this.apiMethods[httpMethod][pattern] = apiInstance;
        } else {
            apiInstance = this.apiMethods[httpMethod][pattern] || null;
        }

        return apiInstance;
    }

    get(pattern: string, fn?: Function): ?ApiMethod {
        return this.api('get', pattern, fn);
    }

    post(pattern: string, fn?: Function): ?ApiMethod {
        return this.api('post', pattern, fn);
    }

    patch(pattern: string, fn?: Function): ?ApiMethod {
        return this.api('patch', pattern, fn);
    }

    delete(pattern: string, fn?: Function): ?ApiMethod {
        return this.api('delete', pattern, fn);
    }

    removeMethod(http: string, pattern: string): void {
        delete this.apiMethods[http][pattern];
    }

    getMethods(): ApiMethods {
        return this.apiMethods;
    }

    getMethod(httpMethod: string, pattern: string): ?ApiMethod {
        httpMethod = httpMethod.toLowerCase();
        return _.get(this.apiMethods, [httpMethod, pattern]);
    }

    matchMethod(httpMethod: string, url: string): ?IMatchedApiMethod {
        let matched = null;
        const apiMethods = this.apiMethods[httpMethod.toLowerCase()];

        if (!apiMethods) {
            return null;
        }

        const methods = [...Object.values(apiMethods)];

        const length = arr => arr.filter(v => !_.isEmpty(v)).length;

        methods.sort((methodA: any, methodB: any) => {
            // 1 means 'a' goes after 'b'
            // -1 means 'a' goes before 'b'

            const a: string = methodA.getPattern();
            const b: string = methodB.getPattern();

            if (a.startsWith('/:') && !b.startsWith('/:')) {
                return 1;
            }

            const al = length(a.split('/'));
            const bl = length(b.split('/'));
            let position = al !== bl ? (al > bl ? -1 : 1) : 0;

            if (position !== 0) {
                return position;
            }

            // Compare number of variables
            const av = length(a.match(/:|\*/g) || []);
            const bv = length(b.match(/:|\*/g) || []);
            return av !== bv ? (av > bv ? 1 : -1) : 0;
        });

        _.each(methods, apiMethod => {
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