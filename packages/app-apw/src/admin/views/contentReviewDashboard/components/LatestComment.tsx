import React from "react";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { useComment } from "~/admin/plugins/editor/comment/hooks/useComment";
import { CommentStatusBox, TypographySecondary } from "./Styled";

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
    const { comment, loading } = useComment({ id });

    if (loading) {
        return <TypographySecondary use={"caption"}>t{`Loading comments...`}</TypographySecondary>;
    }

    return (
        <CommentStatusBox {...boxProps} display={"flex"} paddingX={2.5} paddingY={2}>
            <Typography use={"caption"}>
                {t`{commentedBy} wrote on {commentedOn}:`({
                    commentedBy: comment.createdBy.displayName,
                    commentedOn: comment.createdOn
                })}
            </Typography>
            <TypographySecondary use={"caption"}>{comment.body}</TypographySecondary>
        </CommentStatusBox>
    );
};
