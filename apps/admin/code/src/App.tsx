import React from "react";
import { Admin, AppInstaller, Shell } from "@webiny/app-admin";
import { Preset } from "@webiny/app-admin/preset";
import { Tenancy } from "@webiny/app-tenancy";
import { Security } from "@webiny/app-security";
import { I18N } from "@webiny/app-i18n";
import { PageBuilder } from "@webiny/app-page-builder";
import { HeadlessCMS } from "@webiny/app-headless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { createApolloClient } from "./components/apolloClient";
import "./App.scss";
import { RMWC } from "@webiny/app-admin-rmwc";
import { FileManager } from "@webiny/app-file-manager";
import { GraphQLPlayground } from "@webiny/app-graphql-playground";
import { AccessManagement } from "@webiny/app-security-access-management";

export const App = () => (
    <Admin apolloClient={createApolloClient({ uri: process.env.REACT_APP_GRAPHQL_API_URL })}>
        <Shell />
        <RMWC />
        <Preset />
        <Tenancy />
        <Security />
        <AccessManagement />
        <AppInstaller />
        <FileManager />
        <GraphQLPlayground />
        <I18N />
        <PageBuilder />
        <HeadlessCMS createApolloClient={createApolloClient} />
        <Cognito />
    </Admin>
);
