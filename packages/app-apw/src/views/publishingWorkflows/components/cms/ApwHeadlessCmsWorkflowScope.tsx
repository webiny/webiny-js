import React from "react";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import { CmsScopeSettings } from "./CmsScopeSettings";
import { i18n } from "@webiny/app/i18n";
import { ApwWorkflowApplications, ApwWorkflowScopeTypes } from "~/types";
import { Box, Stack } from "~/components/Layout";
import { validation } from "@webiny/validation";
import { Select } from "@webiny/ui/Select/Select";
import { HigherOrderComponent } from "@webiny/app-admin-core";
import { WorkflowScopeProps } from "~/views/publishingWorkflows/components/WorkflowScope";

const t = i18n.ns("app-apw/admin/publishing-workflows/form/cms");

export const ApwHeadlessCmsWorkflowScope: HigherOrderComponent<
    WorkflowScopeProps
> = WorkflowScope => {
    return function ApwHeadlessCmsWorkflowScope(props) {
        if (props.workflow.app !== ApwWorkflowApplications.CMS) {
            return <WorkflowScope {...props} />;
        }
        const { workflow, Bind } = props;
        const { scope } = workflow;
        const type = get(scope, "type");
        const noPages = isEmpty(get(scope, "data.pages"));
        const noCategories = isEmpty(get(scope, "data.categories"));
        return (
            <Stack space={6}>
                <Box>
                    <Bind name={`scope.type`} validators={validation.create("required")}>
                        <Select label={"Type"} box={"true"}>
                            <option value={""} disabled={true} hidden={true} />
                            <option value={ApwWorkflowScopeTypes.DEFAULT}>{t`Everything`}</option>
                            <option
                                value={ApwWorkflowScopeTypes.CUSTOM}
                            >{t`Specific categories and pages`}</option>
                        </Select>
                    </Bind>
                </Box>
                <Box>
                    {type === ApwWorkflowScopeTypes.CUSTOM && (
                        <CmsScopeSettings Bind={Bind} runValidation={noPages && noCategories} />
                    )}
                </Box>
            </Stack>
        );
    };
};
