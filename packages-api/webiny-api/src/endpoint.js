import ApiContainer from './endpoint/apiContainer';

const apiContainers = {};

class Endpoint {
    init(api) {
        // Override to define your custom API methods
        // NOTE: don't forget to call `super.init(api)`
    }

    getApi() {
        const { app } = require('./index');
        const className = this.constructor.name;
        let apiContainer = apiContainers[className] || null;
        if (!apiContainer) {
            apiContainer = new ApiContainer(this);
            apiContainers[className] = apiContainer;
            this.init(apiContainer);
            app.getApps().map(appInstance => {
                appInstance.applyEndpointExtensions(this);
            });
        }

        return apiContainer;
    }
}

export default Endpoint;