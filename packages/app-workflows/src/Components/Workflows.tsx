import React, { useMemo } from "react";
import { Grid } from "@webiny/admin-ui";
import type { IWorkflowApplication } from "~/types.js";
import { WorkflowApplications } from "./WorkflowApplications.js";
import { WorkflowPresenter } from "./WorkflowPresenter.js";

export interface IWorkflowsProps {
    apps: IWorkflowApplication[];
    app: string | null | undefined;
    onAppClick: (id: string) => void;
}

export const Workflows = (props: IWorkflowsProps) => {
    const { apps, app: initialApp, onAppClick } = props;

    const app = useMemo(() => {
        if (!initialApp || !apps.length) {
            return null;
        }
        return apps.find(a => a.id === initialApp);
    }, [initialApp, apps]);

    return (
        <Grid>
            <Grid.Column span={2}>
                <WorkflowApplications apps={apps} onClick={onAppClick} />
            </Grid.Column>
            <Grid.Column span={10}>{app ? <WorkflowPresenter app={app} /> : null}</Grid.Column>
        </Grid>
    );
};
