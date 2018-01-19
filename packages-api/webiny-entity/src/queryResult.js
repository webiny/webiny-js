class QueryResult {
	constructor(result = null, meta = null) {
		this.result = result;
		this.meta = meta;
	}

	setResult(result) {
		this.result = result;
		return this;
	}

	getResult() {
		return this.result;
	}

	setMeta(meta) {
		this.meta = meta;
		return this;
	}

	getMeta() {
		return this.meta;
	}
}

export default QueryResult;