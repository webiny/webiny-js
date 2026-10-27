import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { FullyDeleteModelError } from "@webiny/app-headless-cms/presentation/contentModels/components/fullDelete/dialog/FullyDeleteModelError.js";
import { useWorkflowsPermission } from "@webiny/app-workflows/presentation/permissions/useWorkflowsPermission.js";
import { ReactComponent as AccountTreeIcon } from "@webiny/icons/account_tree.svg";
import { Routes } from "~/routes.js";
import { getModelDeleteWorkflowCopy } from "./getModelDeleteWorkflowCopy.js";
import type { ModelBoundToWorkflowErrorData } from "./ModelBoundToWorkflowErrorData.js";

const BOUND_TO_WORKFLOW = "Workflows/Model/BoundToWorkflow";

/*
 * A model delete the server refused because a workflow uses the model (UI-18, QBZ-38): names the
 * workflow and links to it for someone who may manage workflows. Any other error stays as it was.
 */
export const ModelDeleteWorkflowError = FullyDeleteModelError.createDecorator(Original => {
    return function ModelDeleteWorkflowErrorDecorator(props) {
        const router = useRouter();
        const permission = useWorkflowsPermission();
        const data = props.error.data as ModelBoundToWorkflowErrorData | null;
        const workflow = data && data.workflows ? data.workflows[0] : undefined;

        if (props.error.code !== BOUND_TO_WORKFLOW || !workflow) {
            return <Original {...props} />;
        }

        const copy = getModelDeleteWorkflowCopy({
            modelName: props.model.name,
            workflowName: workflow.name,
            canManage: permission.editor
        });

        return (
            <Alert type={"danger"} icon={<AccountTreeIcon />}>
                <div className={"flex flex-col gap-xs"}>
                    <Text className={"font-semibold"}>{copy.title}</Text>
                    <Text>{copy.body}</Text>
                    {copy.showLink && (
                        <Link to={router.getLink(Routes.ContentModels.Workflows)}>
                            {"Open workflow →"}
                        </Link>
                    )}
                </div>
            </Alert>
        );
    };
});
