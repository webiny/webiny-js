import adminApp from "@webiny/app-admin/plugins";
import graphqlPlayground from "@webiny/app-graphql-playground/plugins";
import logo from "@webiny/app-admin/plugins/logo";
import help from "@webiny/app-admin/plugins/userMenu/help";
import sendFeedback from "@webiny/app-admin/plugins/userMenu/feedback";
import slack from "@webiny/app-admin/plugins/menu/slack";
import source from "@webiny/app-admin/plugins/menu/source";
import documentation from "@webiny/app-admin/plugins/menu/documentation";
import { createApolloClient } from "../components/apolloClient";

export default [
    adminApp(),
    logo(),
    graphqlPlayground({ createApolloClient }),
    // User meny
    help(),
    sendFeedback(),
    // Navigation menu footer
    documentation(),
    slack(),
    source()
];
