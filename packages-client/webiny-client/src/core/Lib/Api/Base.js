import Webiny from './../../Webiny';
import _ from 'lodash';
import ApiResponse from './Response';
import Http from './../Http/Http';

function handleResponse(response) {
    return new ApiResponse(response);
}

function sanitize(url) {
    url = _.trimStart(url, '/ ');
    return url.length ? '/' + url : '';
}

class Base {
    constructor(url) {
        this.baseUrl = url.toLowerCase();
    }

    get(url = '', body = {}, config = {}) {
        return Http.get(this.fullUrl(url), body, config).then(handleResponse).catch(handleResponse);
    }

    delete(url = '', config = {}) {
        return Http.delete(this.fullUrl(url), config).then(handleResponse).catch(handleResponse);
    }

    head(url = '', config = {}) {
        return Http.head(this.fullUrl(url), config).then(handleResponse).catch(handleResponse);
    }

    post(url = '', body = {}, query = {}, config = {}) {
        return Http.post(this.fullUrl(url), body, query, config).then(handleResponse).catch(handleResponse);
    }

    put(url = '', body = {}, query = {}, config = {}) {
        return Http.put(this.fullUrl(url), body, query, config).then(handleResponse).catch(handleResponse);
    }

    patch(url = '', body = {}, query = {}, config = {}) {
        return Http.patch(this.fullUrl(url), body, query, config).then(handleResponse).catch(handleResponse);
    }

    fullUrl(url) {
        const fullUrl = [
            this.baseUrl.startsWith('http://'),
            this.baseUrl.startsWith('https://'),
            this.baseUrl.startsWith('//')
        ];

        if (_.includes(fullUrl, true)) {
            return this.baseUrl + sanitize(url)
        }

        return Webiny.Config.Api.Url + this.baseUrl + sanitize(url)
    }

}

export default Base;
