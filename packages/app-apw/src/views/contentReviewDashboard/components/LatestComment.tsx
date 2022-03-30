import React from "react";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { useComment } from "~/hooks/useComment";
import { CommentStatusBox, TypographySecondary, AuthorName } from "./Styled";
import { formatDate } from "~/utils";
import { RichTextEditor } from "@webiny/ui/RichTextEditor";

const t = i18n.ns("app-apw/admin/content-reviews/datalist");

export interface Comment {
    body: string;
    commentedBy: string;
    commentedOn: string;
}

export interface LatestCommentProps {
    id: string;
}

export const LatestComment: React.FC<LatestCommentProps> = ({ id, ...boxProps }) => {
    const { comment, loading } = useComment(id);

    if (loading) {
        return <TypographySecondary use={"caption"}>t{`Loading comments...`}</TypographySecondary>;
    }
    /**
     * The latest comment is not tracked on real-time after comments deletion.
     */
    if (!comment) {
        return null;
    }

    return (
        <CommentStatusBox {...boxProps} display={"flex"} paddingX={2.5} paddingY={2}>
            <span>
                <AuthorName use={"caption"}>
                    {t`{commentedBy}`({
                        commentedBy: comment.createdBy.displayName
                    })}
                </AuthorName>
                &nbsp;
                <Typography use={"caption"}>
                    {t`wrote on {commentedOn}:`({
                        commentedOn: formatDate(comment.createdOn)
                    })}
                </Typography>
            </span>
            <TypographySecondary use={"caption"}>
                <RichTextEditor readOnly={true} value={comment.body} />
            </TypographySecondary>
        </CommentStatusBox>
    );
};
