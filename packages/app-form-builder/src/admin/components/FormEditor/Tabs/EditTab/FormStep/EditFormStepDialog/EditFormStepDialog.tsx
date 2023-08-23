import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";

import { Dialog as BaseDialog, DialogContent } from "@webiny/ui/Dialog";
import { ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { FbFormStep, FbFormModel } from "~/types";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { GeneralTab } from "./GeneralTab";
import { RulesTab } from "./RulesTab";

const EditStepDialog = styled(BaseDialog)`
    font-size: 1.4rem;
    color: #fff;
    font-weight: 600;

    & [role="alertdialog"] {
        width: 1100px !important;
    }

    & .mdc-dialog__surface {
        width: 575px;
    }
`;

const DialogHeader = styled.div`
    height: 30px;
    background-color: #00ccb0;
    padding: 20px 20px;
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

type UpdateStepData = {
    title: string;
    rules: any[];
};

export interface DialogProps {
    isEditStep: {
        isOpened: boolean;
        id: string | null;
        step: FbFormStep;
    };
    stepTitle: string;
    setIsEditStep: (params: { isOpened: boolean; id: string | null; step: FbFormStep }) => void;
    setStepTitle: (title: string) => void;
    updateStep: (data: UpdateStepData, id: string | null) => void;
    formData: FbFormModel;
}

export const EditFormStepDialog = ({
    isEditStep,
    setIsEditStep,
    stepTitle,
    setStepTitle,
    updateStep,
    formData
}: DialogProps) => {
    const [rules, setRules] = useState<FbFormStep["rules"]>(isEditStep.step.rules);

    useEffect(() => {
        setRules(isEditStep.step.rules);
    }, [isEditStep.step.rules]);

    return (
        <EditStepDialog
            open={isEditStep.isOpened}
            onClose={() =>
                setIsEditStep({
                    isOpened: false,
                    id: null,
                    step: {} as FbFormStep
                })
            }
        >
            <DialogHeader>
                <span>Step Settings - {isEditStep.step.title}</span>
            </DialogHeader>
            <DialogContent>
                <Tabs>
                    <Tab label={"General"}>
                        <GeneralTab stepTitle={stepTitle} setStepTitle={setStepTitle} />
                    </Tab>
                    <Tab label={"Rules"}>
                        <RulesTab
                            step={isEditStep.step}
                            rules={rules}
                            setRules={setRules}
                            formData={formData}
                        />
                    </Tab>
                </Tabs>
            </DialogContent>
            <DialogActions>
                <ButtonSecondary
                    onClick={() =>
                        setIsEditStep({ isOpened: false, id: null, step: {} as FbFormStep })
                    }
                >
                    Cancel
                </ButtonSecondary>
                <ButtonPrimary
                    onClick={() => {
                        updateStep({ title: stepTitle, rules }, isEditStep.id);
                        setIsEditStep({ isOpened: false, id: null, step: {} as FbFormStep });
                    }}
                >
                    Save
                </ButtonPrimary>
            </DialogActions>
        </EditStepDialog>
    );
};
