import React from "react";
import styled from "@emotion/styled";
import { validation } from "@webiny/validation";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { Checkbox } from "@webiny/ui/Checkbox";
import { BindComponent } from "@webiny/form";
import { Scrollbar } from "@webiny/ui/Scrollbar";

import WorkflowStepLabelLinkIcon from "~/admin/assets/icons/step-label-link.svg";

import { i18n } from "@webiny/app/i18n";
import { Box, Columns, Stack } from "./theme";
import { restGridStyles } from "./Styled";
import { ApwWorkflowStepTypes } from "~/types";

export const GRADIENTS = [
    "135deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%",
    "135deg, #0093E9 0%, #80D0C7 100%",
    "135deg, #FFFFFF 0%, #6284FF 50%, #FF0000 100%",
    "135deg, #FBDA61 0%, #FF5ACD 100%"
];

const StepWrapper = styled.div`
    box-sizing: border-box;
    position: relative;
    width: 100%;
    min-height: 300px;
    margin-top: 36px;
    margin-bottom: 30px;
    padding: 32px 24px 24px;
    border: 1px dashed var(--mdc-theme-secondary);
    border-radius: 6px;

    &::before {
        content: attr(data-step-number);
        position: absolute;
        top: -15px;
        left: 20px;
        background-color: white;
        padding: 5px 30px 7px;
        border: 1px dashed var(--mdc-theme-secondary);
        border-radius: 6px;
        line-height: 1;
    }

    &::after {
        content: "";
        position: absolute;
        width: 8px;
        height: 24px;
        top: -36px;
        left: 70px;
        background-image: url(${WorkflowStepLabelLinkIcon});
        background-repeat: no-repeat;
    }
`;

const ReviewersStack = styled(Stack)`
    box-sizing: border-box;
    min-height: 177px;
    background-color: var(--mdc-theme-background);
    border-radius: 1px;
`;

const Avatar = styled.div<{ index: number }>`
    box-sizing: border-box;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(${props => GRADIENTS[props.index % GRADIENTS.length]});
`;

const CheckboxWrapper = styled.div`
    box-sizing: border-box;
    display: flex;
    justify-content: flex-end;
`;

const Reviewer = ({ displayName, index }) => {
    return (
        <Grid className={restGridStyles}>
            <Cell span={6} align={"middle"}>
                <Columns space={3}>
                    <Box>
                        <Avatar index={index} />
                    </Box>
                    <Box>
                        <Typography use={"subtitle1"}>{displayName}</Typography>
                    </Box>
                </Columns>
            </Cell>
            <Cell span={6}>
                <CheckboxWrapper>
                    <Checkbox />
                </CheckboxWrapper>
            </Cell>
        </Grid>
    );
};

const t = i18n.ns("app-apw/admin/publishing-workflows/form");

interface WorkflowStepProps {
    Bind: BindComponent;
    index: number;
    step: any;
}

function WorkflowStep({ Bind, step, index }: WorkflowStepProps) {
    return (
        <StepWrapper data-step-number={`Step ${index + 1}`}>
            <Grid className={restGridStyles}>
                <Cell span={6}>
                    <Bind name={`steps.${index}.title`} validators={validation.create("required")}>
                        <Input type={"text"} label={"Title"} />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={`steps.${index}.type`} validators={validation.create("required")}>
                        <Select label={"Type"} box={"true"}>
                            <option value={""} disabled={true} hidden={true} />
                            <option
                                value={ApwWorkflowStepTypes.MANDATORY_BLOCKING}
                            >{t`Mandatory, blocking`}</option>
                            <option
                                value={ApwWorkflowStepTypes.MANDATORY_NON_BLOCKING}
                            >{t`Mandatory, non-blocking`}</option>
                            <option
                                value={ApwWorkflowStepTypes.NON_MANDATORY}
                            >{t`Not mandatory`}</option>
                        </Select>
                    </Bind>
                </Cell>
            </Grid>
            <Grid className={restGridStyles}>
                <Cell span={12}>
                    <ReviewersStack space={4} paddingX={5} paddingY={2.5} marginTop={2.5}>
                        <Box>
                            <Typography use={"subtitle1"}>{t`Reviewers`}</Typography>
                        </Box>
                        <Box>
                            <Scrollbar style={{ width: "100%", height: "120px" }}>
                                {[...step.reviewers, ...step.reviewers, ...step.reviewers].map(
                                    (reviewer, index) => (
                                        <Reviewer key={index} {...reviewer} index={index} />
                                    )
                                )}
                            </Scrollbar>
                        </Box>
                    </ReviewersStack>
                </Cell>
            </Grid>
        </StepWrapper>
    );
}

export default WorkflowStep;
