import { AnonymousAuthorizationPlugin } from "../plugins/AnonymousAuthorizationPlugin";

export default () => {
    return new AnonymousAuthorizationPlugin();
};
