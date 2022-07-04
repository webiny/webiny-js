import React, { useRef } from "react";
import styled from "@emotion/styled";
import { useCurrentChangeRequestId } from "~/hooks/useCurrentChangeRequestId";
import { Box, Stack } from "~/components/Layout";
import { PanelBox } from "./Styled";
import ChangeRequest from "./ChangeRequest/ChangeRequest";
import { Comments } from "./Comment/Comments";
import { CommentBox } from "./Comment/CommentBox";

const RightPanelStack = styled(PanelBox)`
    display: flex;
    flex-direction: column;
`;

const CommentStack = styled(Stack)`
    display: flex;
    flex-direction: column;
`;

export const RightPanel: React.FC = () => {
    const changeRequestId = useCurrentChangeRequestId();
    const ref = useRef<HTMLDivElement>(null);

    /**
     * After adding a comment we scroll the comments list to the bottom,
     * so that the latest comment is always visible.
     */
    const scrollToLatestComment = () => {
        if (!ref.current || typeof ref.current.scrollIntoView !== "function") {
            return;
        }
        ref.current.scrollIntoView({
            behavior: "smooth",
            block: "end"
        });
    };

    if (!changeRequestId) {
        return (
            <PanelBox flex={"1 1 52%"}>
                <Box>Placeholder</Box>
            </PanelBox>
        );
    }
    return (
        <RightPanelStack flex={"1 1 52%"}>
            <ChangeRequest id={changeRequestId} />
            <CommentStack space={0}>
                <Comments ref={ref} />
                <CommentBox scrollToLatestComment={scrollToLatestComment} />
            </CommentStack>
        </RightPanelStack>
    );
};
