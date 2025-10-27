import React from "react";
import { List } from "@webiny/admin-ui";
import type { IWorkflowApplication } from "~/types.js";

export interface IWorkflowsApplicationsProps {
    apps: IWorkflowApplication[];
    onClick: (id: string) => void;
}
export const WorkflowsApplications = (props: IWorkflowsApplicationsProps) => {
    const { apps, onClick } = props;
    return (
        <List>
            {apps.map(app => {
                return (
                    <List.Item
                        key={app.id}
                        title={app.name}
                        icon={app.icon}
                        onClick={() => onClick(app.id)}
                    />
                );
            })}
        </List>
    );
};
