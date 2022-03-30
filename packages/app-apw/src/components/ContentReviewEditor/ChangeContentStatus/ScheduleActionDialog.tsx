import React from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

import { css } from "emotion";
import * as UiDialog from "@webiny/ui/Dialog";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { i18n } from "@webiny/app/i18n";
import { Box, Stack } from "~/components/Layout";
import { Input } from "@webiny/ui/Input";
import styled from "@emotion/styled";
import { Form } from "@webiny/form";
import { BindComponent } from "@webiny/form";
import { useContentReviewId } from "~/hooks/useContentReviewId";

import { validation } from "@webiny/validation";

import { useScheduleActionDialog } from "./useScheduleActionDialog";
import { usePublishContent } from "~/hooks/usePublishContent";
import { CircularProgress } from "@webiny/ui/Progress";

const t = i18n.ns("app-apw/content-review/editor/change-request");

const ScheduleActionColumns = styled(Box)`
    width: 700px;
`;

const LeftBox = styled(Box)``;

interface ScheduleActionMessageProps {
    Bind: BindComponent;
    data?: {
        date?: string;
        time?: string;
    };
}

const getTodayDate = (): string => {
    const today = dayjs.utc();
    return today.format("YYYY-MM-DD");
};

const getStartingTimeForScheduling = (): string => {
    return dayjs.utc().add(OFFSET_TIME, "m").format("HH:mm");
};

/**
 *  Maximum date in future till which we allow users to schedule an action.
 *  This is because we use this value as a marker to identify the items/record which has been scheduled already.
 */
const END_OF_CENTURY = `2099-12-31`;
/**
 *  Minimum time from now (in minutes) after which we allow users to schedule an action.
 */
const OFFSET_TIME = 0;

const getTimeGte = (date: string | undefined): string => {
    if (!date) {
        return "";
    }
    const selectedDate = dayjs.utc(date);
    const today = dayjs.utc();

    if (selectedDate.isSame(today, "day")) {
        const datetimeWithOffset = getStartingTimeForScheduling();
        return `timeGte:${datetimeWithOffset}:00`;
    }

    return "";
};

const ScheduleActionMessage: React.FC<ScheduleActionMessageProps> = ({ Bind, data }) => {
    const dateGte = getTodayDate();
    const timeGte = getTimeGte(data?.date);

    return (
        <ScheduleActionColumns>
            <LeftBox padding={6}>
                <Stack space={6}>
                    <Box>
                        <Bind
                            name={"date"}
                            validators={validation.create(
                                `required,dateGte:${dateGte},dateLte:${END_OF_CENTURY}`
                            )}
                        >
                            <Input
                                type={"date"}
                                label={"Date"}
                                description={"Date on which you want to schedule this action"}
                            />
                        </Bind>
                    </Box>
                    <Box>
                        <Bind name={"time"} validators={validation.create(`required,${timeGte}`)}>
                            <Input
                                type={"time"}
                                label={"Time"}
                                description={
                                    "Time is displayed in UTC +00 i.e. timezone is always zero UTC offset"
                                }
                            />
                        </Bind>
                    </Box>
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

export const ScheduleActionDialog: React.FC = () => {
    const { action, openPublishLaterDialog, setOpenPublishLaterDialog } = useScheduleActionDialog();
    const useContentReviewIdResult = useContentReviewId();
    if (!useContentReviewIdResult) {
        return null;
    }
    const { publishContent, unpublishContent, loading } = usePublishContent();

    const resetFormAndCloseDialog = () => {
        closeDialog();
    };

    const closeDialog = () => setOpenPublishLaterDialog(false);

    const onSubmit = async (formData: any) => {
        const now = dayjs.utc(`${formData.date}T${formData.time}`);
        const datetime = now.format();

        if (action === "publish") {
            await publishContent(datetime);
        } else {
            await unpublishContent(datetime);
        }

        resetFormAndCloseDialog();
    };

    const formData = {
        date: getTodayDate(),
        time: getStartingTimeForScheduling()
    };

    return (
        <Form data={formData} onSubmit={onSubmit}>
            {props => (
                <UiDialog.Dialog
                    open={openPublishLaterDialog}
                    onClose={closeDialog}
                    data-testid="apw-scheduler-action-dialog"
                    className={dialogContainerStyles}
                >
                    <UiDialog.DialogTitle>{t`Set Schedule`}</UiDialog.DialogTitle>
                    <DialogContent>
                        {loading && <CircularProgress label={t`Scheduling...`} />}
                        <ScheduleActionMessage Bind={props.Bind} data={props.data} />
                    </DialogContent>
                    <DialogActions>
                        <ButtonDefault onClick={resetFormAndCloseDialog}>{t`Cancel`}</ButtonDefault>
                        <ButtonPrimary
                            onClick={() => {
                                props.submit();
                            }}
                        >{t`Schedule`}</ButtonPrimary>
                    </DialogActions>
                </UiDialog.Dialog>
            )}
        </Form>
    );
};
