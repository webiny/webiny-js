import React, { useCallback, useRef } from "react";
import { Alert, Grid, Input } from "@webiny/admin-ui";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import type { SchedulerEntry } from "~/types";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types";
import type { IScheduleDialogAction } from "./types";
import { ScheduleType } from "~/types.js";
import type { Validator } from "@webiny/validation/types.js";
import ValidationError from "@webiny/validation/validationError.js";

export interface ShowDialogParamsEntry {
    id: string;
    status: CmsContentEntry["meta"]["status"];
    title: string;
    modelId: string;
}

export interface ShowDialogParams {
    entry: ShowDialogParamsEntry;
    schedulerEntry: SchedulerEntry | null;
    action: IScheduleDialogAction;
}

interface UseShowScheduleDialogResponse {
    showDialog: (params: ShowDialogParams) => void;
}

interface FormComponentProps {
    scheduleOn: Date | undefined;
    type: ScheduleType | undefined;
    onCancel: OnCancelCallable;
}

const dateToLocaleStringFormatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: undefined,
    hour12: false
});

const ReschedulingAlert = ({ scheduleOn, type }: FormComponentProps) => {
    if (!scheduleOn || !type) {
        return null;
    }
    const actionName = type === ScheduleType.publish ? "publish" : "unpublish";
    return (
        <Alert type={"danger"}>
            <>
                A {actionName} is already scheduled at
                <br />
                <strong>{dateToLocaleStringFormatter.format(scheduleOn)}</strong>.
            </>
        </Alert>
    );
};

const formatDateForDateTimeLocal = (date?: Date): string | undefined => {
    if (!date) {
        return undefined;
    }
    const pad = (num: number) => {
        return String(num).padStart(2, "0");
    };

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const minDateValidator: Validator = (input: string) => {
    const value = new Date(input);
    const minDate = new Date(new Date().getTime() + 120 * 1000);
    if (minDate < value) {
        return;
    }
    throw new ValidationError(
        `The date must be at least 2 minutes in the future. Current minimum date is ${dateToLocaleStringFormatter.format(
            minDate
        )}.`
    );
};

minDateValidator.validatorName = "minDateValidator";

const FormComponent = ({ scheduleOn, onCancel, type }: FormComponentProps) => {
    return (
        <>
            {<ReschedulingAlert type={type} scheduleOn={scheduleOn} onCancel={onCancel} />}
            <Grid>
                <Grid.Column span={12}>
                    <Bind
                        name={"scheduleOn"}
                        validators={[validation.create("required"), minDateValidator]}
                    >
                        <Input
                            title={"Schedule On"}
                            label={"Schedule On"}
                            size={"lg"}
                            type={"datetime-local"}
                            required
                            autoFocus
                        />
                    </Bind>
                </Grid.Column>
            </Grid>
        </>
    );
};

interface ScheduleFormData {
    scheduleOn?: string;
}

interface IOnAcceptParams {
    action: IScheduleDialogAction;
    scheduleOn: Date;
    entry: ShowDialogParamsEntry;
    type: ScheduleType;
}

interface IOnCancelParams {
    action: IScheduleDialogAction;
    schedulerEntry: SchedulerEntry;
}

interface OnCancelCallable {
    (params: IOnCancelParams): Promise<void>;
}

export const useScheduleDialog = (): UseShowScheduleDialogResponse => {
    const dialog = useDialogs();
    const { showSnackbar } = useSnackbar();

    const dialogClose = useRef<null | (() => void)>(() => {
        return;
    });

    const onAccept = useCallback(async (params: IOnAcceptParams) => {
        const { action, entry, scheduleOn, type } = params;

        try {
            await action.schedule({
                id: entry.id,
                modelId: entry.modelId,
                scheduleOn,
                type
            });
            showSnackbar(`Scheduled ${type} action for "${entry.title}"!`);
        } catch (error) {
            showSnackbar(error.message);
            console.error(error);
        }
    }, []);

    const onCancel = useCallback(async (params: IOnCancelParams) => {
        const { action, schedulerEntry } = params;

        try {
            await action.cancel({
                id: schedulerEntry.id,
                modelId: schedulerEntry.model.modelId
            });
            showSnackbar(`Canceled scheduled ${schedulerEntry.type} on "${schedulerEntry.title}"!`);
        } catch (error) {
            showSnackbar(error.message);
        }
        if (!dialogClose.current) {
            return;
        }
        dialogClose.current();
        dialogClose.current = null;
    }, []);

    const showDialog = (params: ShowDialogParams) => {
        const { schedulerEntry, entry } = params;

        const scheduleOnValue = schedulerEntry?.publishOn || schedulerEntry?.unpublishOn;

        dialogClose.current = dialog.showDialog({
            title: `Schedule "${entry.title}"`,
            content: (
                <FormComponent
                    type={schedulerEntry?.type}
                    scheduleOn={scheduleOnValue}
                    onCancel={onCancel}
                />
            ),
            formData: {
                scheduleOn: formatDateForDateTimeLocal(scheduleOnValue)
            },
            acceptLabel: entry.status === "published" ? "Schedule Unpublish" : "Schedule Publish",
            cancelLabel: "Discard",
            loadingLabel: "Scheduling...",
            onAccept: (data: Partial<ScheduleFormData>) => {
                if (!data.scheduleOn) {
                    showSnackbar(`Missing "Schedule On" date!`);
                    return;
                }
                /**
                 * We need to convert scheduleOn from local string to the ISO String (UTC) format.
                 * This is important because the date will be stored in the database in UTC format.
                 *
                 * We display the date (in the UI) in users timezone time.
                 */
                let scheduleOn: Date;
                try {
                    scheduleOn = new Date(data.scheduleOn);
                } catch (ex) {
                    showSnackbar(`Invalid "Schedule On" date!`);
                    console.error(ex);
                    return;
                }

                onAccept({
                    ...params,
                    scheduleOn,
                    type:
                        entry.status === "published" ? ScheduleType.unpublish : ScheduleType.publish
                });
            }
        });
    };

    return {
        showDialog
    };
};
