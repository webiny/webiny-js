import React, { useMemo } from "react";
import { Alert, Grid } from "@webiny/admin-ui";
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
        if (!initialApp) {
            return null;
        }
        return apps.find(a => a.id === initialApp);
    }, [initialApp, apps]);

    if (!apps.length) {
        return (
            <Grid>
                <Grid.Column span={12}>
                    <Alert type="danger" title="No applications found.">
                        There are no applications available.
                    </Alert>
                </Grid.Column>
            </Grid>
        );
    } else if (initialApp && !app) {
        return (
            <Grid>
                <Grid.Column span={12}>
                    <Alert type="danger" title="No application found.">
                        Application you selected does not exist: <strong>{initialApp}</strong>.
                    </Alert>
                </Grid.Column>
            </Grid>
        );
    }

    return (
        <Grid>
            <Grid.Column span={2}>
                <WorkflowApplications apps={apps} onClick={onAppClick} />
            </Grid.Column>
            <Grid.Column span={10}>{app ? <WorkflowPresenter app={app} /> : null}</Grid.Column>
        </Grid>
    );
};
