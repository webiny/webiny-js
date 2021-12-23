import React from "react";
import styled from "@emotion/styled";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Checkbox } from "@webiny/ui/Checkbox";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { ChildrenRenderProp } from "@webiny/ui/Checkbox/CheckboxGroup";
import { Box, Columns } from "./theme";
import { restGridStyles } from "./Styled";

/**
 * TODO: @ashutosh
 * Fetch reviewers list from API.
 */
const REVIEWERS_MOCK = [
    {
        id: "1234567890",
        displayName: "Jack Wills"
    },
    {
        id: "1234567891",
        displayName: "Ted Bakers"
    },
    {
        id: "1234567892",
        displayName: "Ryan Reynolds"
    }
];

export const GRADIENTS = [
    "135deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%",
    "135deg, #0093E9 0%, #80D0C7 100%",
    "135deg, #FFFFFF 0%, #6284FF 50%, #FF0000 100%",
    "135deg, #FBDA61 0%, #FF5ACD 100%"
];

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

interface ReviewerProps {
    label: string;
    index: number;
    value: boolean;
    onChange: () => void;
}

const Reviewer: React.FC<ReviewerProps> = ({ label, index, value, onChange }) => {
    return (
        <Grid className={restGridStyles}>
            <Cell span={6} align={"middle"}>
                <Columns space={3}>
                    <Box>
                        <Avatar index={index} />
                    </Box>
                    <Box>
                        <Typography use={"subtitle1"}>{label}</Typography>
                    </Box>
                </Columns>
            </Cell>
            <Cell span={6}>
                <CheckboxWrapper>
                    <Checkbox value={value} onClick={onChange} />
                </CheckboxWrapper>
            </Cell>
        </Grid>
    );
};

export const ReviewersList: React.FC<ChildrenRenderProp> = ({ onChange, getValue }) => {
    return (
        <Scrollbar style={{ width: "100%", height: "120px" }}>
            {REVIEWERS_MOCK.map((reviewer, index) => (
                <Reviewer
                    key={index}
                    index={index}
                    label={reviewer.displayName}
                    value={getValue(reviewer.id)}
                    onChange={onChange(reviewer.id)}
                />
            ))}
        </Scrollbar>
    );
};
