import React from "react";
import styled from "@emotion/styled";
import { RichTextEditor } from "@webiny/ui/RichTextEditor";
import { ApwComment } from "~/types";
import { Box, Columns, Stack } from "~/components/Layout";
import { fromNow } from "~/utils";
import { Avatar } from "~/views/publishingWorkflows/components/ReviewersList";
import { useCommentsList } from "~/hooks/useCommentsList";
import { TypographyBody, TypographySecondary, AuthorName, richTextWrapperStyles } from "../Styled";
import { CommentFile } from "../ChangeRequest/ApwFile";
import { FileWithOverlay } from "../ChangeRequest/ChangeRequestMedia";

const HEADER_HEIGHT = "65px";
const CR_DETAIL_HEIGHT = "179px";
const COMMENT_BOX_HEIGHT = "56px";

const CommentsBox = styled(Stack)`
    background-color: var(--mdc-theme-background);
    overflow: auto;
    overscroll-behavior: contain;
    height: calc(100vh - ${HEADER_HEIGHT} - ${CR_DETAIL_HEIGHT} - ${COMMENT_BOX_HEIGHT});
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
        <Stack marginBottom={6} space={2} {...restProps}>
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
                    <RichTextEditor
                        readOnly={true}
                        className={richTextWrapperStyles}
                        value={comment.body}
                    />
                </TypographyBody>
                {comment.media && (
                    <Box padding={4}>
                        <FileWithOverlay media={comment.media} fullWidth={true}>
                            <CommentFile value={comment.media} />
                        </FileWithOverlay>
                    </Box>
                )}
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
