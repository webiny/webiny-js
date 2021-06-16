import { APIKeyAuthenticationPlugin, Config } from "../plugins/APIKeyAuthenticationPlugin";

export default (config?: Config) => {
    return new APIKeyAuthenticationPlugin(config);
};
