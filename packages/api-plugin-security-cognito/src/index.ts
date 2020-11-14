import authentication from "./authentication";
import identityProvider from "./identityProvider";

export default options => [authentication(options), identityProvider(options)];
