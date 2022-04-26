import React from "react";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import { css } from "emotion";
import classNames from "classnames";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as CloseIcon } from "~/assets/icons/close_24dp.svg";
import { Box, Columns, Stack } from "~/components/Layout";
import { CheckboxWrapper, restGridStyles } from "./Styled";
import { BindComponent } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { validation } from "@webiny/validation";
import { ApwWorkflowScope, ApwWorkflowScopeTypes } from "~/types";
import { i18n } from "@webiny/app/i18n";
import PbScopeSettings from "./PbScopeSettings";

const t = i18n.ns("app-apw/admin/publishing-workflows/form");

const textStyle = css`
    color: var(--mdc-theme-text-secondary-on-background);
`;

const borderStyle = css`
    border-bottom: 1px solid var(--mdc-theme-on-background);

    &:last-child {
        border-bottom: none;
    }
`;

interface ListItemWithRemoveProps {
    label: string;
    order: string;
}

export const ListItemWithRemove: React.FC<ListItemWithRemoveProps> = ({ label, order }) => {
    return (
        <Grid className={classNames(restGridStyles, borderStyle)}>
            <Cell span={9} align={"middle"}>
                <Columns space={1}>
                    <Box>
                        <Typography className={textStyle} use={"subtitle2"}>
                            {order}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography className={textStyle} use={"subtitle2"}>
                            {label}
                        </Typography>
                    </Box>
                </Columns>
            </Cell>
            <Cell span={3}>
                <CheckboxWrapper>
                    <IconButton icon={<CloseIcon />} />
                </CheckboxWrapper>
            </Cell>
        </Grid>
    );
};

interface WorkflowScopeProps {
    Bind: BindComponent;
    value: ApwWorkflowScope;
}

function WorkflowScope({ Bind, value }: WorkflowScopeProps) {
    const type = get(value, "type");
    const noPages = isEmpty(get(value, "data.pages"));
    const noCategories = isEmpty(get(value, "data.categories"));
    return (
        <Stack space={6}>
            <Box>
                <Bind name={`scope.type`} validators={validation.create("required")}>
                    <Select label={"Type"} box={"true"}>
                        <option value={""} disabled={true} hidden={true} />
                        <option value={ApwWorkflowScopeTypes.DEFAULT}>{t`Default`}</option>
                        <option value={ApwWorkflowScopeTypes.PB}>{t`Page Builder`}</option>
                    </Select>
                </Bind>
            </Box>
            <Box>
                {type === ApwWorkflowScopeTypes.PB && (
                    <PbScopeSettings Bind={Bind} runValidation={noPages && noCategories} />
                )}
            </Box>
        </Stack>
    );
}

export default WorkflowScope;
