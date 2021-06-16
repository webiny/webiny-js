import { UserAuthorizationPlugin, Config } from "../plugins/UserAuthorizationPlugin";

export default (config: Config) => {
    return new UserAuthorizationPlugin(config);
};
