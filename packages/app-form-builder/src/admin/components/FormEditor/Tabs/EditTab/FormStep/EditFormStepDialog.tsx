import React from "react";
import styled from "@emotion/styled";

import { Dialog as BaseDialog } from "@webiny/ui/Dialog";
import { Form, FormOnSubmit } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { validation } from "@webiny/validation";

const EditStepDialog = styled(BaseDialog)`
    font-size: 1.4rem;
    color: #fff;
    font-weight: 600;

    & .mdc-dialog__surface {
        width: 575px;
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
    isEditStep: {
        isOpened: boolean;
        id: string | null;
    };
    stepTitle: string;
    setIsEditStep: (params: { isOpened: boolean; id: string | null }) => void;
    updateStep: (title: string, id: string | null) => void;
}

type SubmitData = { title: string };

export const EditFormStepDialog = ({
    isEditStep,
    stepTitle,
    setIsEditStep,
    updateStep
}: DialogProps) => {
    const onSubmit: FormOnSubmit<SubmitData> = (_, form) => {
        updateStep(form.data.title, isEditStep.id);
        setIsEditStep({ isOpened: false, id: null });
    };
    return (
        <>
            <EditStepDialog
                open={isEditStep.isOpened}
                onClose={() =>
                    setIsEditStep({
                        isOpened: false,
                        id: null
                    })
                }
            >
                <Form onSubmit={onSubmit} data={{ title: stepTitle }}>
                    {({ Bind, submit }) => (
                        <>
                            <DialogHeader>
                                <span>Change Step Title</span>
                            </DialogHeader>
                            <DialogBody>
                                <Bind name={"title"} validators={[validation.create("required")]}>
                                    <Input label={"Change Step Title"} />
                                </Bind>
                            </DialogBody>
                            <DialogActions>
                                <ButtonSecondary
                                    onClick={() => setIsEditStep({ isOpened: false, id: null })}
                                >
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
