import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import I18NLocalesDataList from "./I18NLocalesDataList";
import I18NLocalesForm from "./I18NLocalesForm";

export default function I18NLocales() {
    return (
        <SplitView>
            <LeftPanel>
                <I18NLocalesDataList />
            </LeftPanel>
            <RightPanel>
                <I18NLocalesForm />
            </RightPanel>
        </SplitView>
    );
}
