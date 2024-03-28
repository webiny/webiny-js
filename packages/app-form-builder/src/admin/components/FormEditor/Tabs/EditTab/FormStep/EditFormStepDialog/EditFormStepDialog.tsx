import React from "react";
import styled from "@emotion/styled";

import { Form, FormOnSubmit } from "@webiny/form";
import { validation } from "@webiny/validation";
import { Dialog as BaseDialog, DialogContent } from "@webiny/ui/Dialog";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { Tabs, Tab } from "@webiny/ui/Tabs";

import { RulesTab } from "./RulesTab/RulesTab";

import { FbFormModel, FbFormStep, FbFormRule } from "~/types";
import { UpdateStepParams } from "~/admin/components/FormEditor/Context/useFormEditorFactory";

const EditStepDialog = styled(BaseDialog)`
    font-size: 1.4rem;
    color: #fff;
    font-weight: 600;
    & .mdc-dialog__surface {
        width: 975px;
        max-width: 975px;
    }
`;

const DialogHeader = styled.div`
    height: 30px;
    background-color: #00ccb0;
    padding: 20px 20px;
    & span {
        vertical-align: middle;
    }
`;

const DialogBody = styled.div`
    padding: 20px 20px;
    min-height: 75px;
`;

const DialogActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 20px 20px;
    border-top: 1px solid rgba(212, 212, 212, 0.5);
    & .webiny-ui-button--primary {
        margin-left: 20px;
    }
`;

export interface DialogProps {
    editStep: {
        isOpened: boolean;
        step: FbFormStep;
    };
    stepTitle: string;
    setEditStep: (params: { isOpened: boolean; step: FbFormStep }) => void;
    updateStep: (params: UpdateStepParams) => void;
    formData: FbFormModel;
}

type SubmitData = { title: string; rules: FbFormRule[] };

export const EditFormStepDialog = ({
    editStep,
    stepTitle,
    setEditStep,
    updateStep,
    formData
}: DialogProps) => {
    const closeEditStepDialog = () => {
        setEditStep({
            isOpened: false,
            step: {} as FbFormStep
        });
    };

    const onSubmit: FormOnSubmit<SubmitData> = (_, form) => {
        const data = {
            title: form.data.title,
            rules: form.data.rules,
            id: editStep.step.id
        };

        updateStep(data);
        closeEditStepDialog();
    };

    return (
        <>
            <EditStepDialog open={true} onClose={closeEditStepDialog}>
                <Form onSubmit={onSubmit} data={{ title: stepTitle, rules: editStep?.step?.rules }}>
                    {({ Bind, submit }) => (
                        <>
                            <DialogHeader>
                                <span>Change Step Title</span>
                            </DialogHeader>
                            <DialogContent>
                                <Tabs>
                                    <Tab label={"General"}>
                                        <DialogBody>
                                            <Bind
                                                name={"title"}
                                                validators={[validation.create("required")]}
                                            >
                                                <Input label={"Change Step Title"} />
                                            </Bind>
                                        </DialogBody>
                                    </Tab>
                                    <Tab label={"Rules"}>
                                        <DialogBody>
                                            <RulesTab
                                                bind={Bind}
                                                formData={formData}
                                                step={editStep.step}
                                            />
                                        </DialogBody>
                                    </Tab>
                                </Tabs>
                            </DialogContent>
                            <DialogActions>
                                <ButtonSecondary onClick={closeEditStepDialog}>
                                    Cancel
                                </ButtonSecondary>
                                <ButtonPrimary onClick={submit}>Save</ButtonPrimary>
                            </DialogActions>
                        </>
                    )}
                </Form>
            </EditStepDialog>
        </>
    );
};
