import React from "react";
import { Admin, AppInstaller } from "@webiny/app-admin";
import { Tenancy } from "@webiny/app-tenancy";
import { Security } from "@webiny/app-security";
import { I18N } from "@webiny/app-i18n";
import { PageBuilder } from "@webiny/app-page-builder";
import { HeadlessCMS } from "@webiny/app-headless-cms";
import { createAuthentication } from "@webiny/app-admin-users-cognito";
import { createApolloClient } from "./components/apolloClient";
import "./App.scss";

export const App = () => (
    <Admin apolloClient={createApolloClient({ uri: process.env.REACT_APP_GRAPHQL_API_URL })}>
        <Tenancy />
        <Security />
        <AppInstaller Authentication={createAuthentication()} />
        <I18N />
        <PageBuilder />
        <HeadlessCMS createApolloClient={createApolloClient} />
    </Admin>
);
