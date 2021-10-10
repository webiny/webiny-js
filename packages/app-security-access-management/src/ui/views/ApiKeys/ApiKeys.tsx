import * as React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import ApiKeysDataList from "./ApiKeysDataList";
import ApiKeyForm from "./ApiKeyForm";

const ApiKeys = ({ formProps, listProps }: any) => {
    return (
        <SplitView>
            <LeftPanel>
                <ApiKeysDataList {...listProps} />
            </LeftPanel>
            <RightPanel>
                <ApiKeyForm {...formProps} />
            </RightPanel>
        </SplitView>
    );
};

export default ApiKeys;
