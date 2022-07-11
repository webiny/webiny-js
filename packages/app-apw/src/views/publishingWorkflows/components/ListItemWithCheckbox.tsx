import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { restGridStyles } from "~/views/publishingWorkflows/components/Styled";
import { Box } from "~/components/Layout";
import { Typography } from "@webiny/ui/Typography";
import { Checkbox } from "@webiny/ui/Checkbox";
import styled from "@emotion/styled";

interface ListItemWithCheckboxProps {
    label: string | React.ReactElement;
    value: boolean;
    onChange: () => void;
}

const CheckboxWrapper = styled.div`
    box-sizing: border-box;
    display: flex;
    justify-content: flex-end;
`;

export const ListItemWithCheckbox: React.FC<ListItemWithCheckboxProps> = ({
    label,
    value,
    onChange
}) => {
    return (
        <Grid className={restGridStyles}>
            <Cell span={6} align={"middle"}>
                {typeof label === "string" ? (
                    <Box>
                        <Typography use={"subtitle1"}>{label}</Typography>
                    </Box>
                ) : (
                    label
                )}
            </Cell>
            <Cell span={6}>
                <CheckboxWrapper>
                    <Checkbox value={value} onClick={onChange} />
                </CheckboxWrapper>
            </Cell>
        </Grid>
    );
};
