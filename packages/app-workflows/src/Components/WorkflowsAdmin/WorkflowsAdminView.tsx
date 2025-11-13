import React, { useMemo } from "react";
import type { IWorkflowApplication } from "~/types.js";
// import { WorkflowsApplications } from "./WorkflowsApplications.js";
import { WorkflowEditor } from "./WorkflowEditor.js";
import {
    LeftPanel,
    RightPanel,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader,
    SplitView
} from "@webiny/app-admin";
import { WorkflowsDataList } from "./WorkflowsDataList.js";

export interface IWorkflowsAdminViewProps {
    apps: IWorkflowApplication[];
    app: string | null | undefined;
    onAppClick: (id: string) => void;
}

export const WorkflowsAdminView = (props: IWorkflowsAdminViewProps) => {
    const { apps, app: initialApp, onAppClick } = props;

    const app = useMemo(() => {
        if (!initialApp) {
            return null;
        }
        return apps.find(a => a.id === initialApp);
    }, [initialApp, apps]);

    return (
        <SplitView>
            <LeftPanel>
                <WorkflowsDataList apps={apps} activeId={app?.id} onSelectApp={onAppClick} />
            </LeftPanel>
            <RightPanel>
                {app && (
                    <SimpleForm size={"lg"}>
                        <SimpleFormHeader title={app.name} />
                        <SimpleFormContent>
                            <WorkflowEditor app={app} />
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <></>
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </RightPanel>
        </SplitView>
    );
};
