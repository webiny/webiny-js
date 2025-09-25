import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import type { FormAPI } from "@webiny/form";
import type { CmsModel, IWorkflow } from "@webiny/app-headless-cms-common/types/index.js";
import type { IWorkflowInput } from "./types.js";
import { PublishingWorkflow } from "./PublishingWorkflow.js";
import { WorkflowsRepository } from "../repositories/index.js";

interface ViewProps {
    form: Pick<FormAPI, "setValue">;
    formData: Pick<CmsModel, "settings">;
}

export const View = observer((props: ViewProps) => {
    const { form, formData } = props;

    const workflows = useMemo(() => {
        return new WorkflowsRepository({
            workflows: formData.settings?.workflows || []
        });
    }, [formData.settings?.workflows]);

    /**
     * This is for a single workflow input. The form field is actually an array of workflows,
     *
     * If we upgrade to multiple workflows per model, should be easy to adjust.
     */
    const setWorkflow = useCallback(
        (input: IWorkflowInput) => {
            form.setValue("settings.workflows", [input]);
        },
        [form]
    );

    const workflow = useMemo((): IWorkflow | null => {
        const item = workflows.list().find(() => true);
        if (!item) {
            return null;
        }
        return structuredClone(item);
    }, [formData]);

    /**
     * Should be fairly simple to extend this to multiple workflows per model, if needed in the future.
     */
    return (
        <>
            <PublishingWorkflow workflow={workflow} setWorkflow={setWorkflow} />
        </>
    );
});
