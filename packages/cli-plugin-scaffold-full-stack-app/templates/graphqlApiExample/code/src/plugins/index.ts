import { plugins } from "@webiny/plugins";
import apolloLinkPlugins from "./apollo";
import home from "./routes/home";
import notFound from "./routes/notFound";
import graphqlApiExample from "./routes/graphqlApiExample";

// Imports and registers all defined plugins.
plugins.register([
    // Various Apollo client plugins.
    apolloLinkPlugins,

    // Application routes.
    home,
    notFound,

    // Contains the GraphQL API example page.
    graphqlApiExample
]);
