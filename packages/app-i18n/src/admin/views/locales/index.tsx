import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import LocalesDataList from "./LocalesDataList";
import LocaleForm from "./LocaleForm";

export const LocalesView = () => {
    return (
        <SplitView>
            <LeftPanel>
                <LocalesDataList />
            </LeftPanel>
            <RightPanel>
                <LocaleForm />
            </RightPanel>
        </SplitView>
    );
};
