import _ from 'lodash';
import ApiMethod from './apiMethod';
import MatchedApiMethod from './matchedApiMethod';

class ApiContainer {
    constructor(context) {
        this.apiMethods = {};
        this.context = context;
    }

    /**
     * Create a GET method
     *
     * @param pattern URL pattern
     * @param fn Callback to execute when method is matched
     *
     * return ApiMethod|null
     */
    get(pattern, fn = null) {
        return this.api('get', pattern, fn);
    }

    /**
     * Create a POST method
     *
     * @param pattern URL pattern
     * @param fn Callback to execute when method is matched
     *
     * @return ApiMethod|null
     */
    post(pattern, fn = null) {
        return this.api('post', pattern, fn);
    }

    /**
     * Create a PATCH method
     *
     * @param pattern URL pattern
     * @param fn Callback to execute when method is matched
     *
     * @return ApiMethod|null
     */
    patch(pattern, fn = null) {
        return this.api('patch', pattern, fn);
    }

    /**
     * Create a DELETE method
     *
     * @param pattern URL pattern
     * @param fn Callback to execute when method is matched
     *
     * @return ApiMethod|null
     */
    delete(pattern, fn = null) {
        return this.api('delete', pattern, fn);
    }

    /**
     * Remove method from API container
     *
     * @param http HTTP method
     * @param pattern Pattern
     *
     * @return this
     */
    removeMethod(http, pattern) {
        delete this.apiMethods[http][pattern];

        return this;
    }

    /**
     * @return object
     */
    getMethods() {
        return this.apiMethods;
    }

    /**
     * Get ApiMethod for given http method and url pattern
     *
     * @param httpMethod
     * @param pattern
     *
     * @return ApiMethod|null
     */
    getMethod(httpMethod, pattern) {
        httpMethod = httpMethod.toLowerCase();
        return _.get(this.apiMethods, [httpMethod, pattern]);
    }

    api(httpMethod, pattern, callable = null) {
        if (!pattern.startsWith('/')) {
            pattern = '/' + pattern;
        }

        httpMethod = httpMethod.toLowerCase();

        if (callable && !_.has(this.apiMethods, httpMethod)) {
            this.apiMethods[httpMethod] = {};
        }

        let apiInstance;
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

    matchMethod(httpMethod, url) {
        let matched = null;
        const apiMethods = this.apiMethods[httpMethod.toLowerCase()];

        if (!apiMethods) {
            return null;
        }
        
        const methods = [...Object.values(apiMethods)];

        const length = arr => arr.filter(v => !_.isEmpty(v)).length;

        methods.sort((a, b) => {
            // 1 means 'a' goes after 'b'
            // -1 means 'a' goes before 'b'

            a = a.getPattern();
            b = b.getPattern();

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