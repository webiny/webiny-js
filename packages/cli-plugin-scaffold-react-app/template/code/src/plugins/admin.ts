import adminApp from "@webiny/app-admin/plugins";
import graphqlPlayground from "@webiny/app-graphql-playground/plugins";
import logo from "@webiny/app-admin/plugins/logo";
import fileManager from "@webiny/app-admin/plugins/menu/fileManager";
import slack from "@webiny/app-admin/plugins/menu/slack";
import source from "@webiny/app-admin/plugins/menu/source";
import documentation from "@webiny/app-admin/plugins/menu/documentation";
import { createApolloClient } from "../components/apolloClient";

export default [
    adminApp(),
    logo(),
    graphqlPlayground({ createApolloClient }),
    // Navigation menu footer
    fileManager(),
    documentation(),
    slack(),
    source()
];
