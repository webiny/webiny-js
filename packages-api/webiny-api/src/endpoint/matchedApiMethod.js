class MatchedApiMethod {
    constructor(apiMethod, params) {
        this.apiMethod = apiMethod;
        this.params = params;
    }

    getApiMethod() {
        return this.apiMethod;
    }

    getParams() {
        return this.params;
    }
}

export default MatchedApiMethod;