import React from "react";
import dotPropImmutable from "dot-prop-immutable";
import isEmpty from "lodash/isEmpty";
import { PbScopeSettings } from "./PbScopeSettings";
import { ApwWorkflowApplications, ApwWorkflowScopeTypes } from "~/types";
import { Box, Stack } from "~/components/Layout";
import { validation } from "@webiny/validation";
import { Select } from "@webiny/ui/Select/Select";
import { i18n } from "@webiny/app/i18n";
import { HigherOrderComponent } from "@webiny/app-admin";
import { WorkflowScopeProps } from "../WorkflowScope";

const t = i18n.ns("app-apw/admin/publishing-workflows/form/page-builder");

const PageBuilderWorkflowScope = (props: WorkflowScopeProps) => {
    const { Bind, workflow } = props;
    const { scope } = workflow;
    const type = dotPropImmutable.get(scope, "type");
    const noPages = isEmpty(dotPropImmutable.get(scope, "data.pages"));
    const noCategories = isEmpty(dotPropImmutable.get(scope, "data.categories"));
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
                    <PbScopeSettings Bind={Bind} runValidation={noPages && noCategories} />
                )}
            </Box>
        </Stack>
    );
};

export const ApwPageBuilderWorkflowScope: HigherOrderComponent<
    WorkflowScopeProps
> = WorkflowScope => {
    return function ApwPageBuilderWorkflowScope(props) {
        if (props.workflow.app !== ApwWorkflowApplications.PB) {
            return <WorkflowScope {...props} />;
        }
        return <PageBuilderWorkflowScope {...props} />;
    };
};
