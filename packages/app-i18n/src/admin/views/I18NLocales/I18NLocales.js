import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";
import I18NLocalesDataList from "./I18NLocalesDataList";
import I18NLocalesForm from "./I18NLocalesForm";
import { READ_LOCALE, LIST_LOCALES, CREATE_LOCALE, UPDATE_LOCALE, DELETE_LOCALE } from "./graphql";

export default function I18NLocales({ scopes, formProps, listProps }) {
    return (
        <CrudProvider
            delete={DELETE_LOCALE}
            read={READ_LOCALE}
            create={CREATE_LOCALE}
            update={UPDATE_LOCALE}
            list={{
                query: LIST_LOCALES,
                variables: { sort: { savedOn: -1 } }
            }}
        >
            {({ actions }) => (
                <>
                    <SplitView>
                        <LeftPanel>
                            <I18NLocalesDataList {...listProps} />
                        </LeftPanel>
                        <RightPanel>
                            <I18NLocalesForm scopes={scopes} {...formProps} />
                        </RightPanel>
                    </SplitView>
                    <FloatingActionButton onClick={actions.resetForm} />
                </>
            )}
        </CrudProvider>
    );
}
