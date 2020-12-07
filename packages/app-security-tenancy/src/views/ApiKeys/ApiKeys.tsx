import * as React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import ApiKeysDataList from "./ApiKeysDataList";
import ApiKeyForm from "./ApiKeyForm";
import { useRouter } from "@webiny/react-router";

const ApiKeys = ({ formProps, listProps }: any) => {
    const { history } = useRouter();

    return (
        <>
            <SplitView>
                <LeftPanel>
                    <ApiKeysDataList {...listProps} />
                </LeftPanel>
                <RightPanel>
                    <ApiKeyForm {...formProps} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton
                data-testid="new-record-button"
                onClick={() => history.push("/security/api-keys")}
            />
        </>
    );
};

export default ApiKeys;
