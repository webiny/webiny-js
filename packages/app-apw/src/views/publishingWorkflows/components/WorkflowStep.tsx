import React from "react";
import styled from "@emotion/styled";
import { validation } from "@webiny/validation";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { CheckboxGroup } from "@webiny/ui/Checkbox";
import { BindComponent } from "@webiny/form";
import { IconButton } from "@webiny/ui/Button";
import { css } from "emotion";
import { ReactComponent as CloseIcon } from "~/assets/icons/close_24dp.svg";

import { ApwWorkflowStepTypes } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Box, Stack } from "~/components/Layout";
import { restGridStyles, StepWrapper } from "./Styled";
import { ReviewersList } from "./ReviewersList";

const ReviewersStack = styled(Stack)`
    box-sizing: border-box;
    min-height: 177px;
    background-color: var(--mdc-theme-background);
    border-radius: 1px;
`;

const removeStepStyles = css`
    &.mdc-icon-button {
        position: absolute;
        top: -44px;
        right: -12px;
    }
`;

const t = i18n.ns("app-apw/admin/publishing-workflows/form");

interface WorkflowStepProps {
    Bind: BindComponent;
    index: number;
    removeStep: () => void;
}

function WorkflowStep({ Bind, index, removeStep }: WorkflowStepProps) {
    return (
        <StepWrapper data-step-number={`Step ${index + 1}`}>
            {index >= 1 && (
                <IconButton
                    icon={<CloseIcon />}
                    className={removeStepStyles}
                    onClick={removeStep}
                />
            )}
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
                            <Bind
                                name={`steps.${index}.reviewers`}
                                validators={validation.create("minLength:1")}
                            >
                                <CheckboxGroup>
                                    {props => <ReviewersList {...props} />}
                                </CheckboxGroup>
                            </Bind>
                        </Box>
                    </ReviewersStack>
                </Cell>
            </Grid>
        </StepWrapper>
    );
}

export default WorkflowStep;
