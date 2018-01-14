// @flow
import ApiContainer from './apiContainer';
import App from './../etc/app';

// Container for ApiContainer instances
// The definition of an Endpoint class stays the same no matter how many instances we create so we only need one copy of ApiContainer per endpoint.
const apiContainers: { [key: string]: ApiContainer } = {};

class Endpoint {
    static classId: string;

    init(api: ApiContainer) {
        // Override to define your custom API methods
        // NOTE: don't forget to call `super.init(api)`
    }

    getApi(): ApiContainer {
        const { app } = require('./../index');
        const className = this.constructor.name;
        let apiContainer = apiContainers[className] || null;
        if (!apiContainer) {
            apiContainer = new ApiContainer(this);
            apiContainers[className] = apiContainer;
            this.init(apiContainer);
            app.getApps().map((appInstance: App) => {
                appInstance.applyEndpointExtensions(this);
            });
        }

        return apiContainer;
    }
}

export default Endpoint;