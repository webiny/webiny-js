import React from "react";
import { PanelBox } from "./Styled";

import { Stack } from "~/admin/components/Layout";
import ChangeRequest from "./ChangeRequest/ChangeRequest";
import Comments from "./Comment/Comments";
import CommentBox from "./Comment/CommentBox";

const RightPanel = () => {
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

export default RightPanel;
