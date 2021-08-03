import { plugins } from "@webiny/plugins";
import apolloLinkPlugins from "./apolloLinks";
import home from "./routes/home";
import notFound from "./routes/notFound";

plugins.register([
    /**
     * Apollo client link plugins.
     */
    apolloLinkPlugins,

    /**
     * Application routes.
     */
    home,
    notFound
]);
