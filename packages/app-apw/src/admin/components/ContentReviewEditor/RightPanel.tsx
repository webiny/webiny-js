import React from "react";
import { PanelBox } from "./Styled";
import { useParams } from "@webiny/react-router";
import { Box, Stack } from "~/admin/components/Layout";
import ChangeRequest from "./ChangeRequest/ChangeRequest";
import Comments from "./Comment/Comments";
import CommentBox from "./Comment/CommentBox";

interface RightPanelProps {
    currentStepId: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({ currentStepId }) => {
    const { changeRequestId } = useParams() as { changeRequestId: string };
    console.log(JSON.stringify({ changeRequestId, currentStepId }, null, 2));
    if (!currentStepId || !changeRequestId) {
        return (
            <PanelBox flex={"1 1 52%"}>
                <Box>Placeholder</Box>
            </PanelBox>
        );
    }
    return (
        <PanelBox flex={"1 1 52%"}>
            <ChangeRequest />
            <Stack space={0}>
                <Comments />
                <CommentBox />
            </Stack>
        </PanelBox>
    );
};
