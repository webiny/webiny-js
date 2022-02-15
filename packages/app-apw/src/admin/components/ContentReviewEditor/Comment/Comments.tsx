import React from "react";
import styled from "@emotion/styled";
import { RichTextEditor } from "@webiny/ui/RichTextEditor";
import { ApwComment } from "~/types";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import { fromNow } from "~/admin/components/utils";
import { Avatar } from "~/admin/views/publishingWorkflows/components/ReviewersList";
import { useCommentsList } from "~/admin/hooks/useCommentsList";
import { TypographyBody, TypographySecondary, AuthorName } from "../Styled";

const CommentsBox = styled(Stack)`
    background-color: var(--mdc-theme-background);
    overflow: auto;
    height: calc(100vh - 64px - 178px - 56px);
    overscroll-behavior: contain;
`;

const CommentBox = styled(Box)`
    background-color: var(--mdc-theme-surface);
    border-radius: 4px;
`;

interface CommentProps {
    comment: ApwComment;
    width?: string;
}

const Comment: React.FC<CommentProps> = props => {
    const { comment, ...restProps } = props;
    return (
        <Stack space={2} {...restProps}>
            <Columns space={2.5} paddingLeft={1}>
                <Box>
                    <Avatar index={0} />
                </Box>
                <Box>
                    <AuthorName use={"subtitle1"}>{comment.createdBy.displayName}</AuthorName>
                </Box>
            </Columns>
            <CommentBox paddingX={3.5} paddingY={5}>
                <TypographyBody use={"caption"}>
                    <RichTextEditor readOnly={true} value={comment.body} />
                </TypographyBody>
            </CommentBox>
            <Box paddingLeft={3.5}>
                <TypographySecondary use={"caption"}>
                    {fromNow(comment.createdOn)}
                </TypographySecondary>
            </Box>
        </Stack>
    );
};

export const Comments = React.forwardRef<HTMLDivElement>(function comments(_, ref) {
    const { comments } = useCommentsList();

    return (
        <CommentsBox space={6} paddingX={6} paddingY={5}>
            <Box>
                {comments.map(item => (
                    <Comment key={item.id} comment={item} />
                ))}
            </Box>
            <Box ref={ref} />
        </CommentsBox>
    );
});
