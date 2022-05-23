import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as CloseIcon } from "~/assets/icons/close_24dp.svg";
import { Box, Columns } from "~/components/Layout";
import { CheckboxWrapper, restGridStyles } from "./Styled";
import { BindComponent } from "@webiny/form";
import { ApwWorkflow } from "~/types";
import { makeComposable } from "@webiny/app-admin-core";

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

export interface WorkflowScopeProps {
    Bind: BindComponent;
    workflow: ApwWorkflow;
}

export const WorkflowScope = makeComposable<WorkflowScopeProps>("WorkflowScope", props => {
    const { workflow } = props;
    return (
        <div>
            There is no WorkflowScope for <strong>{workflow.app}</strong> application.
        </div>
    );
});
