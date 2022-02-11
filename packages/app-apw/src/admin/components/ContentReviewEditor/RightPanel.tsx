import React from "react";
import { useCurrentChangeRequestId } from "~/admin/hooks/useCurrentChangeRequestId";
import { Box, Stack } from "~/admin/components/Layout";
import { PanelBox } from "./Styled";
import ChangeRequest from "./ChangeRequest/ChangeRequest";
import { Comments } from "./Comment/Comments";
import { CommentBox } from "./Comment/CommentBox";

export const RightPanel = () => {
    const changeRequestId = useCurrentChangeRequestId();

    if (!changeRequestId) {
        return (
            <PanelBox flex={"1 1 52%"}>
                <Box>Placeholder</Box>
            </PanelBox>
        );
    }
    return (
        <PanelBox flex={"1 1 52%"}>
            <ChangeRequest id={changeRequestId} />
            <Stack space={0}>
                <Comments />
                <CommentBox />
            </Stack>
        </PanelBox>
    );
};
