import adminApp from "@webiny/app-admin/defaults";
import graphqlPlayground from "@webiny/app-graphql-playground/plugins";
import logo from "@webiny/app-admin/defaults/logo";
import fileManager from "@webiny/app-admin/defaults/menu/fileManager";
import slack from "@webiny/app-admin/defaults/menu/slack";
import source from "@webiny/app-admin/defaults/menu/source";
import documentation from "@webiny/app-admin/defaults/menu/documentation";
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
