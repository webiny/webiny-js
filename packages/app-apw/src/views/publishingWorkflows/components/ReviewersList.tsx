import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { ChildrenRenderProp } from "@webiny/ui/Checkbox/CheckboxGroup";
import { Box, Columns } from "~/components/Layout";
import { useReviewers } from "~/hooks/useReviewers";
import { ListItemWithCheckbox } from "./ListItemWithCheckbox";

export const GRADIENTS = [
    "135deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%",
    "135deg, #0093E9 0%, #80D0C7 100%",
    "135deg, #FFFFFF 0%, #6284FF 50%, #FF0000 100%",
    "135deg, #FBDA61 0%, #FF5ACD 100%"
];

export const Avatar = styled.div<{ index: number }>`
    box-sizing: border-box;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(${props => GRADIENTS[props.index % GRADIENTS.length]});
`;

const ReviewerName = styled(Typography)`
    text-transform: capitalize;
`;

interface ListItemTitleProps {
    label: string;
    index: number;
}

const ListItemTitle: React.FC<ListItemTitleProps> = ({ index, label }) => {
    return (
        <Columns space={3} alignItems={"center"}>
            <Box>
                <Avatar index={index} />
            </Box>
            <Box>
                <ReviewerName use={"subtitle1"}>{label}</ReviewerName>
            </Box>
        </Columns>
    );
};

export const ReviewersList: React.FC<ChildrenRenderProp> = ({ onChange, getValue }) => {
    const { reviewers, loading } = useReviewers();

    if (loading || !reviewers || reviewers.length === 0) {
        return (
            <div style={{ width: "100%", height: "120px" }}>
                <Typography use={"subtitle2"}>Loading reviewers...</Typography>
            </div>
        );
    }

    return (
        <Scrollbar style={{ width: "100%", height: "120px" }}>
            {reviewers.map((reviewer, index) => (
                <ListItemWithCheckbox
                    key={reviewer.id}
                    label={<ListItemTitle index={index} label={reviewer.displayName} />}
                    value={getValue(reviewer.id)}
                    onChange={onChange(reviewer.id)}
                />
            ))}
        </Scrollbar>
    );
};
