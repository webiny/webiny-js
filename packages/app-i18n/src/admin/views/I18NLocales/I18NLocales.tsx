import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import I18NLocalesDataList from "./I18NLocalesDataList";
import I18NLocalesForm from "./I18NLocalesForm";
import { useRouter } from "@webiny/react-router";

export default function I18NLocales() {
    const { history } = useRouter();
    return (
        <>
            <SplitView>
                <LeftPanel>
                    <I18NLocalesDataList />
                </LeftPanel>
                <RightPanel>
                    <I18NLocalesForm />
                </RightPanel>
            </SplitView>
            <FloatingActionButton onClick={() => history.push("/i18n/locales")} />
        </>
    );
}
