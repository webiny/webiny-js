import React, { useEffect, useMemo } from "react";
import type { FormAPI } from "@webiny/form";
import type { CmsModel, IWorkflow } from "@webiny/app-headless-cms-common/types/index.js";
import { PublishingWorkflow } from "./PublishingWorkflow.js";
import { WorkflowsRepository } from "../repositories/index.js";
import { reaction } from "mobx";
import type { IWorkflowModel } from "~/admin/plugins/editor/publishingWorkflows/models/abstractions/WorkflowModel.js";
import type { NonEmptyArray } from "@webiny/app/types.js";

interface ViewProps {
    form: Pick<FormAPI, "setValue">;
    formData: Pick<CmsModel, "settings">;
}

const defaultWorkflow: IWorkflow = {
    id: "default",
    name: "Default Workflow",
    steps: []
};
const getWorkflows = (workflows?: IWorkflow[] | null): NonEmptyArray<IWorkflow> => {
    if (!workflows?.length) {
        return [defaultWorkflow];
    }
    /**
     * Should always have the default workflow present.
     * But let's check just in case.
     */
    const hasDefault = workflows.find(wf => wf.id === defaultWorkflow.id);
    if (!hasDefault) {
        workflows.push(defaultWorkflow);
        return workflows as NonEmptyArray<IWorkflow>;
    }
    return workflows as NonEmptyArray<IWorkflow>;
};

export const View = (props: ViewProps) => {
    const { form, formData } = props;

    const repository = useMemo(() => {
        return new WorkflowsRepository({
            workflows: getWorkflows(formData.settings?.workflows)
        });
    }, [formData.settings?.workflows]);

    const workflow = useMemo((): IWorkflowModel => {
        /**
         * For now, we always return the "default" workflow.
         */
        return repository.findOne(defaultWorkflow.id);
    }, [formData]);

    useEffect(() => {
        const disposer = reaction(
            () => {
                return repository.list().map(workflow => ({
                    ...workflow,
                    steps: workflow.steps.map(step => ({
                        ...step,
                        teams: step.teams.map(team => {
                            return {
                                id: team.id
                            };
                        }),
                        notifications: step.notifications?.map(notification => {
                            return {
                                id: notification.id
                            };
                        })
                    }))
                }));
            },
            snapshot => {
                form.setValue("settings.workflows", snapshot);
            },
            {
                fireImmediately: true
            }
        );

        return () => {
            return disposer();
        };
    }, [repository, form]);
    /**
     * Should be fairly simple to extend this to multiple workflows per model, if needed in the future.
     */
    return (
        <>
            <PublishingWorkflow workflow={workflow} />
        </>
    );
};
