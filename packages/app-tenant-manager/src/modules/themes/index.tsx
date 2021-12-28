import React, { Fragment } from "react";
import gql from "graphql-tag";
import { Provider, Extensions, AddMenu, AddRoute, Layout } from "@webiny/app-serverless-cms";
import { AddTenantFormField } from "~/components/AddTenantFormField";
import { Themes } from "./Themes";
import { ThemeCheckboxGroup } from "~/components/ThemeCheckboxGroup";
import { ThemeManagerProviderHOC } from "./ThemeManagerProvider";
import { IsRootTenant } from "~/components/IsRootTenant";

const RoutesAndMenus = () => {
    return (
        <IsRootTenant>
            <AddMenu id="tenantManager">
                <AddMenu id={"tenantManager.themes"} label={`Themes`} path="/themes" />
            </AddMenu>
            <AddRoute exact path={"/themes"}>
                <Layout title={"Tenant Manager - Themes"}>
                    <Themes />
                </Layout>
            </AddRoute>
        </IsRootTenant>
    );
};

const TenantFormFields = () => {
    const selection = gql`
        {
            settings {
                themes
            }
        }
    `;

    return <AddTenantFormField querySelection={selection} element={<ThemeCheckboxGroup />} />;
};

export const ThemesModule = () => {
    return (
        <Fragment>
            <Provider hoc={ThemeManagerProviderHOC} />
            <Extensions>
                <RoutesAndMenus />
                <TenantFormFields />
            </Extensions>
        </Fragment>
    );
};
