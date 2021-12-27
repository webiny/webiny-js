import React from "react";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { CommentStatusBox, TypographySecondary } from "./Styled";

const t = i18n.ns("app-apw/admin/content-reviews/datalist");

export interface LatestCommentProps {
    comment: string;
    commentedBy: string;
    commentedOn: string;
}

export const LatestComment: React.FC<LatestCommentProps> = ({
    comment,
    commentedBy,
    commentedOn,
    ...boxProps
}) => {
    return (
        <CommentStatusBox {...boxProps} display={"flex"} paddingX={2.5} paddingY={2}>
            <Typography use={"caption"}>
                {t`{commentedBy} wrote on {commentedOn}:`({
                    commentedBy,
                    commentedOn
                })}
            </Typography>
            <TypographySecondary use={"caption"}>{comment}</TypographySecondary>
        </CommentStatusBox>
    );
};
