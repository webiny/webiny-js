import React from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import isEmpty from "lodash/isEmpty";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { ButtonDefault, ButtonPrimary, ButtonIcon } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { usePublishingWorkflowForm } from "./hooks/usePublishingWorkflowForm";

import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as WorkflowScopeIcon } from "~/admin/assets/icons/workflow-scope.svg";
import { ReactComponent as WorkflowStepIcon } from "~/admin/assets/icons/workflow-step.svg";

import WorkflowStep from "./components/WorkflowStep";
import Title, { WorkflowFormHeader } from "./components/WorkflowTitle";
import WorkflowScope from "./components/WorkflowScope";
import { ApwWorkflowScopeTypes } from "~/types";

const t = i18n.ns("app-apw/admin/publishing-workflows/form");

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between"
});

const formFooterStyle = css`
    border-top: none;
`;

const initialStepData = {
    title: "",
    type: "",
    reviewers: []
};

const initialWorkflow = {
    title: "Untitled",
    steps: [initialStepData],
    scope: {
        type: ApwWorkflowScopeTypes.PB,
        data: {
            pages: [],
            categories: [],
            entries: [],
            models: []
        }
    }
};

const workflowStepsDescription = t`Define the workflow steps and assign which users need to provide an approval.`;

const PublishingWorkflowForm = () => {
    const { workflow, loading, showEmptyView, cancelEditing, onSubmit } =
        usePublishingWorkflowForm();

    /*
     *  Render empty view.
     */
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display workflow details...`}
                action={null}
            />
        );
    }

    return (
        <Form data={isEmpty(workflow) ? initialWorkflow : workflow} onSubmit={onSubmit}>
            {({ data, form, Bind, setValue }) => {
                const addStep = () => setValue("steps", [...data.steps, initialStepData]);
                const removeStep = (index: number) =>
                    setValue("steps", [
                        ...data.steps.slice(0, index),
                        ...data.steps.slice(index + 1)
                    ]);

                return (
                    <SimpleForm data-testid={"apw-publishing-workflow-form"}>
                        {loading && <CircularProgress />}
                        <Bind name="title">
                            {props => <WorkflowFormHeader Title={<Title {...props} />} />}
                        </Bind>
                        <SimpleFormContent>
                            <Accordion elevation={0}>
                                <AccordionItem
                                    icon={<WorkflowStepIcon />}
                                    title={t`Workflow steps`}
                                    description={workflowStepsDescription}
                                >
                                    <Bind name={"steps"}>
                                        {({ value }) =>
                                            value &&
                                            value.map((_, index) => (
                                                <WorkflowStep
                                                    key={index}
                                                    Bind={Bind}
                                                    index={index}
                                                    removeStep={() => removeStep(index)}
                                                />
                                            ))
                                        }
                                    </Bind>
                                    <ButtonPrimary
                                        onClick={addStep}
                                        style={{ backgroundColor: "var(--mdc-theme-secondary)" }}
                                    >
                                        <ButtonIcon icon={<AddIcon />} />
                                        {t`Add Step`}
                                    </ButtonPrimary>
                                </AccordionItem>
                                <AccordionItem
                                    icon={<WorkflowScopeIcon />}
                                    title={t`Scope`}
                                    description={t`Define the conditions when this workflow applies.`}
                                >
                                    <WorkflowScope Bind={Bind} type={data.scope.type} />
                                </AccordionItem>
                            </Accordion>
                        </SimpleFormContent>
                        <SimpleFormFooter className={formFooterStyle}>
                            <ButtonWrapper>
                                <ButtonDefault onClick={cancelEditing}>{t`Cancel`}</ButtonDefault>
                                <ButtonPrimary onClick={form.submit}>{t`Save`}</ButtonPrimary>
                            </ButtonWrapper>
                        </SimpleFormFooter>
                    </SimpleForm>
                );
            }}
        </Form>
    );
};

export default PublishingWorkflowForm;
