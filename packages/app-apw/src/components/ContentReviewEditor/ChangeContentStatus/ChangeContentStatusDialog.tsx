import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import * as UiDialog from "@webiny/ui/Dialog";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Box, Columns, Stack } from "~/components/Layout";
import { useContentReviewId } from "~/hooks/useContentReviewId";
import { usePublishContent } from "~/hooks/usePublishContent";
import { ReactComponent as ScheduleIcon } from "~/assets/icons/schedule_24dp.svg";
import { ScheduleActionType, useScheduleActionDialog } from "./useScheduleActionDialog";

const t = i18n.ns("app-apw/content-review/editor/change-request");

const ScheduleActionColumns = styled(Box)`
    width: 700px;
`;

const LeftBox = styled(Box)``;

interface PublishContentMessageProps {
    publishNow: () => void;
    setSchedule: () => void;
    action: ScheduleActionType;
}

const PublishContentMessage: React.FC<PublishContentMessageProps> = ({
    publishNow,
    setSchedule,
    action
}) => {
    const label = action === "publish" ? t`Publish` : t`Unpublish`;

    return (
        <ScheduleActionColumns>
            <LeftBox padding={6}>
                <Stack space={6}>
                    <Box>
                        <Typography use={"body1"}>
                            {t`You can choose to {action} the content right away, or at a later time by picking a date.`(
                                { action }
                            )}
                        </Typography>
                    </Box>
                    <Columns space={10}>
                        <Box>
                            <ButtonDefault onClick={publishNow}>
                                {t`{label} Now`({ label })}
                            </ButtonDefault>
                        </Box>
                        <Box>
                            <ButtonDefault onClick={setSchedule}>
                                <ButtonIcon icon={<ScheduleIcon />} />
                                {t`Schedule {label}`({ label })}
                            </ButtonDefault>
                        </Box>
                    </Columns>
                </Stack>
            </LeftBox>
        </ScheduleActionColumns>
    );
};

const DialogActions = styled(UiDialog.DialogActions)`
    justify-content: space-between;
`;

const DialogContent = styled(UiDialog.DialogContent)`
    padding: 0 !important;
`;

const dialogContainerStyles = css`
    /*
* By default, a Dialog component has the "z-index" value of 20.
* As we are rendering the content entry form in a "Dialog", the File Manager view triggered by a "file" field
* will render below the source form, rendering it useless for the user.
*
* To fix that issue, we're setting the "z-index" CSS property for this particular Dialog to less than 18,
* which is the "z-index" value assigned to File Manager view, so that it will render below the File Manager view as expected.
*/

    &.mdc-dialog {
        z-index: 17;
    }
`;

export const ChangeContentStatusDialog: React.FC = () => {
    const { action, openPublishNowDialog, setOpenPublishNowDialog, setOpenPublishLaterDialog } =
        useScheduleActionDialog();
    const useContentReviewIdResult = useContentReviewId();
    if (!useContentReviewIdResult) {
        return null;
    }

    const { publishContent, unpublishContent, loading } = usePublishContent();

    const resetFormAndCloseDialog = () => {
        closeDialog();
    };

    const closeDialog = () => setOpenPublishNowDialog(false);

    const handlePublishNow = async () => {
        if (action === "publish") {
            await publishContent();
        } else {
            await unpublishContent();
        }
        closeDialog();
    };

    const handleSchedule = () => {
        closeDialog();
        setOpenPublishLaterDialog(true);
    };

    const title = action === "publish" ? t`Publish Content` : t`Unpublish Content`;
    const loadingLabel = action === "publish" ? t`Publishing...` : t`Unpublishing...`;

    return (
        <UiDialog.Dialog
            open={openPublishNowDialog}
            onClose={closeDialog}
            data-testid="apw-publish-content-dialog"
            className={dialogContainerStyles}
        >
            <UiDialog.DialogTitle>{title}</UiDialog.DialogTitle>
            <DialogContent>
                {loading && <CircularProgress label={loadingLabel} />}
                <PublishContentMessage
                    publishNow={handlePublishNow}
                    setSchedule={handleSchedule}
                    action={action}
                />
            </DialogContent>
            <DialogActions>
                <ButtonDefault onClick={resetFormAndCloseDialog}>{t`Cancel`}</ButtonDefault>
            </DialogActions>
        </UiDialog.Dialog>
    );
};
