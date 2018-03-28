// @flow
import ApiMethod from './apiMethod';

class MatchedApiMethod {
    apiMethod: ApiMethod;
    params: Object;

    constructor(apiMethod: ApiMethod, params: Object) {
        this.apiMethod = apiMethod;
        this.params = params;
    }

    getApiMethod(): ApiMethod {
        return this.apiMethod;
    }

    getParams(): Object {
        return this.params;
    }
}

export default MatchedApiMethod;