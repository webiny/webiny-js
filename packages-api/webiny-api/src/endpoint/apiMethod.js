import _ from 'lodash';

let count = 0;

class ApiMethod {
    constructor(httpMethod, pattern, context) {
        this.httpMethod = httpMethod;
        this.context = context;
        this.pattern = pattern.startsWith('/') ? pattern : '/' + pattern;
        this.callbacks = [];
        this.namedParam = /:\w+/g;
        this.wildcardParam = /\*\w+/g;
        this.paramNames = [];

        count++;

        // Extract params names
        const params = pattern.match(this.namedParam);
        if (params) {
            params.forEach(item => {
                this.paramNames.push(item.replace(':', ''));
            });
        }

        const wildcardParams = pattern.match(this.wildcardParam);
        if (wildcardParams) {
            wildcardParams.forEach(item => {
                this.paramNames.push(item.replace('*', ''));
            });
        }

        // Build route regex
        const regex = pattern.replace(this.namedParam, '([^\/]+)').replace(this.wildcardParam, '(.*?)');
        this.regex = new RegExp('^' + regex + '$');
    }

    getPattern() {
        return this.pattern;
    }

    getRegex() {
        return this.regex;
    }

    exec(req, res, params, context) {
        if ((this.httpMethod === 'post' || this.httpMethod === 'patch')) {
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

    addCallback(callable) {
        this.callbacks.unshift(callable);
        return this;
    }

    createParent(index, bindTo) {
        const $this = this;
        return function (...params) {
            let callback = $this.callbacks[index];
            if ($this.callbacks.length > (index + 1)) {
                params.push($this.createParent(index + 1, bindTo));
            }

            callback = callback.bind(bindTo);

            return callback(...params);
        };
    }
}

export default ApiMethod;