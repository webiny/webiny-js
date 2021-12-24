import React, { Fragment, memo } from "react";
import { plugins } from "@webiny/plugins";
import { Provider, Extensions, AddMenu } from "@webiny/app-admin";
import { I18NProvider as ContextProvider } from "./contexts/I18N";
import { HasPermission } from "@webiny/app-security/";
import { AddRoute } from "@webiny/app-admin";
import { Layout } from "@webiny/app-admin";
import { LocalesView } from "./admin/views/locales";
import i18nPlugins from "./admin/plugins";

const I18NProviderHOC = Component => {
    return function I18NProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
};

const I18NExtension = () => {
    plugins.register(i18nPlugins());

    return (
        <Fragment>
            <Provider hoc={I18NProviderHOC} />
            <Extensions>
                <HasPermission name={"i18n.locale"}>
                    <AddRoute exact path={"/i18n/locales"}>
                        <Layout title={"I18N - Locales"}>
                            <LocalesView />
                        </Layout>
                    </AddRoute>
                    <AddMenu id={"settings"}>
                        <AddMenu id={"settings.i18n"} label={"Languages"}>
                            <AddMenu
                                id={"settings.i18n.locales"}
                                label={"Locales"}
                                path={"/i18n/locales"}
                            />
                        </AddMenu>
                    </AddMenu>
                </HasPermission>
            </Extensions>
        </Fragment>
    );
};

export const I18N = memo(I18NExtension);
