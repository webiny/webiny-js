import _ from 'lodash';

class App {
    constructor() {
        this.name = 'Default.App';
        this.modules = [];
        this.dependencies = [];
        this.onBeforeRender = _.noop;
    }

    run() {
        let chain = Promise.resolve();
        this.dependencies.map(app => {
            chain = chain.then(() => app.run());
        });

        return chain.then(() => {
            this.modules.map(m => m.init());
            return Promise.resolve(this.onBeforeRender());
        });
    }

    beforeRender(callback = null) {
        if (!_.isFunction(callback)) {
            return this.onBeforeRender;
        }

        this.onBeforeRender = callback;
        return this;
    }
}

export default App;