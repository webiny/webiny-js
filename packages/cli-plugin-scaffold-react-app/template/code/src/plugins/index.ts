import { plugins } from "@webiny/plugins";
import apolloLinkPlugins from "./apolloLinks";
import home from "./routes/home";

plugins.register([
    /**
     * ApolloClient link plugins.
     */
    apolloLinkPlugins,

    /**
     * Application routes.
     */
    home
]);
