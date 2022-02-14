import React, { useRef } from "react";
import { useCurrentChangeRequestId } from "~/admin/hooks/useCurrentChangeRequestId";
import { Box, Stack } from "~/admin/components/Layout";
import { PanelBox } from "./Styled";
import ChangeRequest from "./ChangeRequest/ChangeRequest";
import { Comments } from "./Comment/Comments";
import { CommentBox } from "./Comment/CommentBox";

export const RightPanel = () => {
    const changeRequestId = useCurrentChangeRequestId();
    const ref = useRef<HTMLDivElement>(null);

    /**
     * After adding a comment we scroll the comments list to the bottom,
     * so that the latest comment is always visible.
     */
    const scrollToLatestComment = () => {
        if (ref && ref.current) {
            if (typeof ref.current.scrollIntoView === "function") {
                ref.current.scrollIntoView({ behavior: "smooth", block: "end" });
            }
        }
    };

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
                <Comments ref={ref} />
                <CommentBox scrollToLatestComment={scrollToLatestComment} />
            </Stack>
        </PanelBox>
    );
};
