import { APIKeyAuthorizationPlugin, Config } from "../plugins/APIKeyAuthorizationPlugin";

export default (config?: Config) => {
    return new APIKeyAuthorizationPlugin(config);
};
