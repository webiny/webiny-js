import _ from 'lodash';
import Base from './Base';

const apiProps = [
    'fields',
    'page',
    'perPage',
    'sort',
    'searchFields',
    'searchQuery',
    'searchOperator'
];

function normalizeParams(params) {
    const verifiedParams = {};
    _.each(params, (v, k) => {
        if (k === 'fields' || k === '_fields') {
            v = v.replace(' ', '');
        }
        if (apiProps.indexOf(k) > -1) {
            verifiedParams['_' + k] = v;
        } else {
            verifiedParams[k] = v;
        }
    });
    return verifiedParams;
}

class Endpoint extends Base {

    constructor(baseUrl, config = {}) {
        super(baseUrl);
        // console.info('%c[New Endpoint]: ' + baseUrl, 'color: #1918DE; font-weight: bold', config);
        // URL is a relative part of request, containing entity/service action
        this.url = config.url || '/';
        // GET, POST, PATCH, PUT, DELETE, HEAD
        this.httpMethod = config.httpMethod || 'GET';
        // initial query params that will be sent with every request until they is changed by component, using setQuery() method or via request arguments
        this.query = config.query || {};
        // initial body payload that will be sent with every request until it is changed by component, using setBody() method or via request arguments
        this.body = config.body || {};
        // config contains optional request parameters, like `progress` handler
        this.config = config;

        // These two properties hold temporary values that can be changed between requests
        this.tmpQuery = {};
        this.tmpBody = {};

        if (_.indexOf(['PATCH', 'POST'], this.httpMethod) === -1) {
            this.body = null;
        }
    }

    setUrl(url) {
        this.url = url;
        return this;
    }

    getUrl(value = null) {
        if (_.isFunction(this.url)) {
            return this.url(value);
        }

        if (value) {
            return (this.url + '/' + value).replace('//', '/');
        }

        return this.url;
    }

    setHttpMethod(httpMethod) {
        this.httpMethod = httpMethod;
        return this;
    }

    setBody(body) {
        this.tmpBody = body;
        return this;
    }

    setQuery(query) {
        this.tmpQuery = _.pickBy(query, (v, k) => !_.isUndefined(v) || !_.has(this.query, k));
        return this;
    }

    setConfig(config) {
        this.config = config;
        return this;
    }

    getQuery(query = null) {
        const mergedQuery = normalizeParams(this.query);
        // Create new query object by merging current query parameters with new query parameters.
        // New query parameters can be set by `setQuery` (assigned to this.tmpQuery) or passed directly as query parameter to this method.
        const newQuery = _.merge({}, mergedQuery, query || this.tmpQuery);
        // Remove all null and undefined values
        return _.omitBy(newQuery, v => _.isNil(v));
    }

    getBody(body = null) {
        return _.merge({}, this.body, body || this.tmpBody);
    }

    get(url = '', query = null) {
        return super.get(url, this.getQuery(query), this.config);
    }

    delete(url = '') {
        return super.delete(url, this.config);
    }

    head(url = '') {
        return super.head(url, this.config);
    }

    post(url = '', body = null, query = null) {
        return super.post(url, this.getBody(body), this.getQuery(query), this.config);
    }

    patch(url = '', body = null, query = null) {
        return super.patch(url, this.getBody(body), this.getQuery(query), this.config);
    }

    put(url = '', body = null, query = null) {
        return super.put(url, this.getBody(body), this.getQuery(query), this.config);
    }

    execute(httpMethod = null, url = null, body = null, query = null) {
        if (!url) {
            url = this.getUrl() || '/';
        }

        url = url.replace(/\/\/+/g, '/');

        if (!httpMethod) {
            httpMethod = this.httpMethod;
        }

        let request = null;
        switch (_.lowerCase(httpMethod)) {
            case 'get':
                request = this.get(url, query);
                break;
            case 'post':
                request = this.post(url, body, query);
                break;
            case 'patch':
                request = this.patch(url, body, query);
                break;
            case 'put':
                request = this.put(url, body, query);
                break;
            case 'delete':
                request = this.delete(url);
                break;
            case 'head':
                request = this.head(url);
                break;
            default:
                throw new Error('Unable to execute url: ' + httpMethod + ' ' + url);
        }

        return request;
    }
}

export default Endpoint;