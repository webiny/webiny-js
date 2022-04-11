import styled from "@emotion/styled";
import React from "react";
import { Box, Stack } from "~/components/Layout";
import { ButtonIcon, ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { ReactComponent as CheckIcon } from "~/assets/icons/check_24dp.svg";
import { ApwContentReview, ApwContentReviewStatus } from "~/types";

import { i18n } from "@webiny/app/i18n";
import { Tooltip } from "@webiny/ui/Tooltip";
import { usePublishContent } from "~/hooks/usePublishContent";
import { CircularProgress } from "@webiny/ui/Progress";
import { useScheduleActionDialog } from "./useScheduleActionDialog";
import { Typography } from "@webiny/ui/Typography";
import { useCurrentContentReview } from "~/hooks/useContentReview";
import { formatDatetime } from "~/utils";

const t = i18n.ns("app-apw/content-reviews/editor/steps/publishContent");

const ContentStatusContainer = styled(Stack)`
    border-top: 1px solid var(--mdc-theme-background);
`;

const PublishContentBox = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 56px;
    border-top: 1px solid var(--mdc-theme-background);
`;

const defaultButtonStyles = { width: "217px" };
const activeButtonStyles = { backgroundColor: "var(--mdc-theme-secondary)" };

export const ChangeContentStatusButton: React.FC = () => {
    const { contentReview } = useCurrentContentReview();
    const { loading, deleteScheduledAction } = usePublishContent();
    const { setAction, setOpenPublishNowDialog } = useScheduleActionDialog();
    const disabledButtonTooltip = t`Content can only be published once all sign offs have been provided.`;
    const alreadyPublishedMessage = t`Content has been already published.`;

    const handlePublishContent = () => {
        setAction("publish");
        setOpenPublishNowDialog(true);
    };
    const handleUnpublishContent = () => {
        setAction("unpublish");
        setOpenPublishNowDialog(true);
    };

    if (loading) {
        return <CircularProgress label={"Loading"} />;
    }
    /**
     * If the content is "underReview" render disabled action button with tooltip.
     */
    if (contentReview.status === ApwContentReviewStatus.UNDER_REVIEW) {
        return (
            <PublishContentBox paddingX={5}>
                <Tooltip
                    content={
                        contentReview.status === ApwContentReviewStatus.UNDER_REVIEW
                            ? disabledButtonTooltip
                            : alreadyPublishedMessage
                    }
                >
                    <ButtonPrimary style={defaultButtonStyles} disabled={true}>
                        <ButtonIcon icon={<CheckIcon />} />
                        {t` Publish Content`}
                    </ButtonPrimary>
                </Tooltip>
            </PublishContentBox>
        );
    }

    /**
     * If an action has been scheduled for the content. Render content status and "Unset schedule" CTA.
     */
    if (contentReview.content.scheduledOn) {
        return (
            <>
                <ContentStatus content={contentReview.content} />
                <PublishContentBox>
                    <ButtonDefault style={defaultButtonStyles} onClick={deleteScheduledAction}>
                        <ButtonIcon icon={<CheckIcon />} />
                        {t`Unset schedule`}
                    </ButtonDefault>
                </PublishContentBox>
            </>
        );
    }
    /**
     * If the content has already been published, render content status and "unpublish" CTA.
     */
    if (contentReview.status === ApwContentReviewStatus.PUBLISHED) {
        return (
            <>
                <ContentStatus content={contentReview.content} />
                <PublishContentBox paddingX={5}>
                    <ButtonDefault style={defaultButtonStyles} onClick={handleUnpublishContent}>
                        <ButtonIcon icon={<CheckIcon />} />
                        {t`Un-Publish Content`}
                    </ButtonDefault>
                </PublishContentBox>
            </>
        );
    }

    /**
     * Render "publish" CTA.
     */
    return (
        <PublishContentBox paddingX={5}>
            <ButtonPrimary
                style={{ ...defaultButtonStyles, ...activeButtonStyles }}
                onClick={handlePublishContent}
            >
                <ButtonIcon icon={<CheckIcon />} />
                {t` Publish Content`}
            </ButtonPrimary>
        </PublishContentBox>
    );
};

const TypographySecondary = styled(Typography)`
    color: var(--mdc-theme-text-secondary-on-background);
`;

const AuthorName = styled(TypographySecondary)`
    color: var(--mdc-theme-text-secondary-on-background);
    text-transform: capitalize;
`;

export type ContentStatusProps = Pick<ApwContentReview, "content">;

export const ContentStatus: React.FC<ContentStatusProps> = ({ content }) => {
    const label = content.scheduledOn ? t`Content Scheduled On:` : t`Content Published On:`;
    const name = content.scheduledOn
        ? content.scheduledBy?.displayName
        : content.publishedBy?.displayName;
    const datetime = content.scheduledOn ? content.scheduledOn : content.publishedOn;

    return (
        <ContentStatusContainer space={0} paddingTop={4} paddingX={4} paddingBottom={2}>
            <Box>
                <Typography use={"overline"}>{label}</Typography>
                <br />
                <TypographySecondary use={"caption"}>
                    {t`{datetime} UTC`({
                        datetime: formatDatetime(datetime || "")
                    })}
                </TypographySecondary>
            </Box>
            <Box>
                <Typography use={"overline"}>{t`By:`}</Typography>&nbsp;
                <AuthorName use={"caption"}>{name}</AuthorName>
            </Box>
        </ContentStatusContainer>
    );
};
