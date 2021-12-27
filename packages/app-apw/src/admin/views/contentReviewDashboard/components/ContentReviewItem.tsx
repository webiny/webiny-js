import React from "react";
import { listItemStyles, StatusBox, TypographyBold } from "./Styled";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";

import { ContentReviewBy, ContentReviewByProps } from "./ContentReviewSubmittedInfo";
import { ContentReviewStatus, ContentReviewStatusProps } from "./ContentReviewStatus";
import { LatestComment, LatestCommentProps } from "./LatestComment";

const t = i18n.ns("app-apw/admin/content-reviews/datalist");

interface ContentReviewItemProps
    extends ContentReviewByProps,
        ContentReviewStatusProps,
        LatestCommentProps {
    activeStep: string;
    contentTitle: string;
    contentRevisionNumber: number;
}

const statusBoxWidth = "126px";

const ContentReviewListItem: React.FC<ContentReviewItemProps> = ({
    activeStep,
    contentTitle,
    contentRevisionNumber,
    submittedOn,
    submittedBy,
    comments,
    reviewers,
    status,
    comment,
    commentedBy,
    commentedOn
}) => {
    return (
        <Columns space={0} className={listItemStyles}>
            <Box
                width={`calc(100% - ${statusBoxWidth})`}
                paddingLeft={5}
                paddingRight={4}
                paddingTop={3}
                paddingBottom={3}
            >
                <Stack space={3}>
                    <Columns space={1} justifyContent={"space-between"} alignItems={"center"}>
                        <Box>
                            <TypographyBold use={"subtitle1"}>{contentTitle}</TypographyBold>
                        </Box>
                        <Box display={"flex"} justifyContent={"flex-end"}>
                            <Typography use={"caption"}>
                                {t`rev #{version}`({ version: contentRevisionNumber })}
                            </Typography>
                        </Box>
                    </Columns>
                    <Stack space={2}>
                        <ContentReviewBy submittedOn={submittedOn} submittedBy={submittedBy} />
                        <StatusBox display={"flex"} paddingX={2.5} width={"fit-content"}>
                            <Typography use={"caption"}>{activeStep}</Typography>
                        </StatusBox>
                    </Stack>
                    <LatestComment
                        comment={comment}
                        commentedOn={commentedOn}
                        commentedBy={commentedBy}
                    />
                </Stack>
            </Box>
            <ContentReviewStatus
                width={statusBoxWidth}
                status={status}
                comments={comments}
                reviewers={reviewers}
            />
        </Columns>
    );
};

export default ContentReviewListItem;
