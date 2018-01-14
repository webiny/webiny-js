import _ from 'lodash';

class HttpResponse {

    constructor(response, request) {
        this.data = response.data;
        this.status = response.status;
        this.statusText = response.statusText;
        this.headers = response.headers;
        this.request = request;
    }

    getData(key, defaultValue) {
        return key ? _.get(this.data, key, defaultValue) : this.data;
    }

    setData(data) {
        this.data = data;
        return this;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status) {
        this.status = status;
        return this;
    }

    getStatusText() {
        return this.statusText;
    }

    setStatusText(statusText) {
        this.statusText = statusText;
        return this;
    }

    getHeaders() {
        return this.headers;
    }
}

export default HttpResponse;