import * as React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { ApiKeysDataList, ApiKeysDataListProps } from "./ApiKeysDataList";
import { ApiKeyForm, ApiKeyFormProps } from "./ApiKeyForm";

export interface ApiKeysProps {
    listProps?: ApiKeysDataListProps;
    formProps?: ApiKeyFormProps;
}
export const ApiKeys = ({ formProps = {}, listProps = {} }: ApiKeysProps) => {
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
