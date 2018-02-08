// @flow
import _ from "lodash";
import ApiContainer from "./apiContainer";
import App from "./../etc/app";
import api from "./../index";

// Container for ApiContainer instances
// The definition of an Endpoint class stays the same no matter how many instances we create so we only need one copy of ApiContainer per endpoint.
const apiContainers: { [classId: string]: { [version: string]: ApiContainer } } = {};

class Endpoint {
    static classId: string;
    static version: string;

    // eslint-disable-next-line
    init(api: ApiContainer) {
        // Override to define your custom API methods
        // NOTE: don't forget to call `super.init(api)`
    }

    getApi(): ApiContainer {
        const classId = this.constructor.classId;
        const version = this.constructor.version;
        let apiContainer = _.get(apiContainers, [classId, version]);
        if (!apiContainer) {
            apiContainer = new ApiContainer(this);
            _.set(apiContainers, [classId, version], apiContainer);
            this.init(apiContainer);
            api.getApps().map((appInstance: App) => {
                appInstance.applyEndpointExtensions(this);
            });
        }

        return apiContainer;
    }
}

export default Endpoint;
