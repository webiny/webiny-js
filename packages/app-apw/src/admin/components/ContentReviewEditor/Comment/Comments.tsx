import styled from "@emotion/styled";
import React from "react";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import { Avatar } from "~/admin/views/publishingWorkflows/components/ReviewersList";
import { TypographyBody, TypographySecondary, TypographyTitle } from "../Styled";

const CommentsBox = styled(Stack)`
    background-color: var(--mdc-theme-background);
    overflow: auto;
    height: calc(100vh - 64px - 178px - 56px);
`;

const CommentBox = styled(Box)`
    background-color: var(--mdc-theme-surface);
    border-radius: 4px;
`;

const MOCK_COMMENT = `You sure about this? I mean, I’m looking at a shoot here: https://deploy-preview-333--webiny-docs.netlify.app/assets/images/full-stack-app-scaffold-31df83423c46fb20648943b39419d942.png

It’s 1) You want to include a sample GQL API? 2) You want to deploy ?`;

const Comment = props => {
    return (
        <Stack space={2} {...props}>
            <Columns space={2.5} paddingLeft={1}>
                <Box>
                    <Avatar index={0} />
                </Box>
                <Box>
                    <TypographyTitle use={"subtitle1"}>{`Adrian Smijulj`}</TypographyTitle>
                </Box>
            </Columns>
            <CommentBox paddingX={3.5} paddingY={5}>
                <TypographyBody use={"caption"}>{MOCK_COMMENT}</TypographyBody>
            </CommentBox>
            <Box paddingLeft={3.5}>
                <TypographySecondary use={"caption"}>{`5 min ago`}</TypographySecondary>
            </Box>
        </Stack>
    );
};

function Comments() {
    return (
        <CommentsBox space={6} paddingX={6} paddingY={5}>
            <Comment />
            <Comment />
            <Comment />
            <Comment />
            <Comment />
        </CommentsBox>
    );
}

export default Comments;
