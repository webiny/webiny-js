import { CognitoAuthenticationPlugin, Config } from "./CognitoAuthenticationPlugin";

export default (config: Config) => new CognitoAuthenticationPlugin(config);
