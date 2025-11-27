import React, { useMemo } from "react";
import { Alert } from "@webiny/admin-ui";
import { useCanUseWorkflows } from "~/hooks/canUseWorkflows.js";
import {
    LeftPanel,
    RightPanel,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader,
    SplitView
} from "@webiny/app-admin";
import { WorkflowsDataList } from "~/Components/WorkflowsEditor/DataList/WorkflowsDataList.js";
import { WorkflowEditor } from "./Editor/WorkflowEditor.js";
import type { IWorkflowApplication } from "~/types.js";

export interface IWorkflowsEditorProps {
    apps: IWorkflowApplication[];
    app: string | null | undefined;
    onAppClick: (id: string) => void;
}
/**
 * Main component which should get used to render Workflows Admin UI.
 */
export const WorkflowsEditorBase = (props: IWorkflowsEditorProps) => {
    const { apps, onAppClick, app: initialApp } = props;

    const canUseWorkflows = useCanUseWorkflows();

    const app = useMemo(() => {
        if (!initialApp) {
            return null;
        }
        return apps.find(a => a.id === initialApp);
    }, [initialApp, apps]);

    if (!canUseWorkflows) {
        return (
            <Alert type={"danger"} title={"You don't have access to Workflows."}>
                You do not have access to Workflows. Please contact your system administrator.
            </Alert>
        );
    }

    return (
        <SplitView>
            <LeftPanel>
                <WorkflowsDataList apps={apps} activeId={app?.id} onSelectApp={onAppClick} />
            </LeftPanel>
            <RightPanel>
                {app ? (
                    <SimpleForm size={"lg"}>
                        <SimpleFormHeader title={app.name} />
                        <SimpleFormContent>
                            <WorkflowEditor app={app} />
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <></>
                        </SimpleFormFooter>
                    </SimpleForm>
                ) : null}
            </RightPanel>
        </SplitView>
    );
};
