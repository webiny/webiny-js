import React from "react";
import upperCase from "lodash/upperCase";
import { ApwContentReviewContent, ApwContentReviewStatus } from "~/types";
import { Box, Columns, Stack } from "~/components/Layout";
import {
    Circle,
    CommentCountBox,
    CommentsCount,
    OverlappingAvatar,
    statusBoxStyle,
    StatusText
} from "./Styled";

export const statusToLevel = {
    [ApwContentReviewStatus.UNDER_REVIEW]: 0,
    [ApwContentReviewStatus.READY_TO_BE_PUBLISHED]: 1,
    [ApwContentReviewStatus.PUBLISHED]: 2
};

const CommentBadge: React.FC<{ comments: number }> = ({ comments, ...props }) => {
    return (
        <CommentCountBox {...props} width={"fit-content"}>
            <CommentsCount>{comments}</CommentsCount>
        </CommentCountBox>
    );
};

const getScheduledMessage = (status: ApwContentReviewStatus): string => {
    return `Content scheduled for ${
        status === ApwContentReviewStatus.READY_TO_BE_PUBLISHED ? "publishing" : "unpublishing"
    }`;
};

export interface ContentReviewStatusProps {
    status: ApwContentReviewStatus;
    comments: number;
    reviewers: string[];
    width?: string;
    content: ApwContentReviewContent;
}

export const ContentReviewStatus: React.FC<ContentReviewStatusProps> = ({
    status,
    comments,
    reviewers,
    content,
    ...boxProps
}) => {
    const level = statusToLevel[status];
    const label = content.scheduledOn ? getScheduledMessage(status) : status;
    return (
        <Stack {...boxProps} space={2} className={statusBoxStyle} padding={4} paddingBottom={3}>
            <Columns space={4}>
                <Circle active={level >= 0} />
                <Circle active={level >= 1} />
                <Circle active={level >= 2} />
            </Columns>
            <Box display={"flex"}>
                <StatusText>{upperCase(label)}</StatusText>
            </Box>
            <Columns space={2.5} alignItems={"center"}>
                <Columns space={1.5}>
                    {reviewers.map((_, index) => (
                        <OverlappingAvatar key={index} useNegativeMargin={true} />
                    ))}
                </Columns>
                <CommentBadge comments={comments} />
            </Columns>
        </Stack>
    );
};
