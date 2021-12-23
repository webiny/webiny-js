import adminApp from "@webiny/app-admin/plugins";
import graphqlPlayground from "@webiny/app-graphql-playground/plugins";
import logo from "@webiny/app-admin/plugins/logo";
import { createApolloClient } from "../components/apolloClient";

export default [
    adminApp(),
    logo(),
    graphqlPlayground({ createApolloClient })
];
