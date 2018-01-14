class Module {
    constructor(name, callable) {
        this.name = name;
        this.callable = callable;
        this.context = null;
        this.tags = null;
    }

    setContext(context) {
        this.context = context;
        return this;
    }

    setTags(...tags) {
        this.tags = tags;
        return this;
    }

    load() {
        return Promise.resolve(this.callable());
    }
}

export default Module;