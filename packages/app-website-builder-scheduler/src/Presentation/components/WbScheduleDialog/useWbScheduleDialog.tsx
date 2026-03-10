import React, { useCallback, useRef } from "react";
import { Alert, Grid, Input } from "@webiny/admin-ui";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { Bind, type BindComponentRenderProp } from "@webiny/form";
import { validation } from "@webiny/validation";
import type { WbSchedulerEntry } from "~/types.js";
import type { IWbScheduleDialogAction } from "./types.js";
import { ScheduleType } from "~/types.js";
import type { Validator } from "@webiny/validation/types.js";
import ValidationError from "@webiny/validation/validationError.js";
import { makeDecoratable } from "@webiny/react-composition";

export interface ShowWbDialogParamsEntry {
    id: string;
    status: string;
    title: string;
}

export interface ShowWbDialogParams {
    entry: ShowWbDialogParamsEntry;
    schedulerEntry: WbSchedulerEntry | null;
    action: IWbScheduleDialogAction;
}

interface UseShowWbScheduleDialogResponse {
    showDialog: (params: ShowWbDialogParams) => void;
}

interface FormComponentProps {
    scheduleOn: Date | undefined;
    type: ScheduleType | undefined;
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

const ReschedulingAlert = ({
    scheduleOn,
    type
}: Pick<FormComponentProps, "scheduleOn" | "type">) => {
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

/**
 * DO NOT use a library for this!
 */
const padLeft = (num: number) => {
    return String(num).padStart(2, "0");
};

const formatDateForDateTimeLocal = (date?: Date | string): string | undefined => {
    if (!date) {
        return undefined;
    } else if (typeof date === "string") {
        date = new Date(date);
    }

    const year = date.getFullYear();
    const month = padLeft(date.getMonth() + 1);
    const day = padLeft(date.getDate());
    const hours = padLeft(date.getHours());
    const minutes = padLeft(date.getMinutes());

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

export interface IWbSchedulerDialogFormComponentDateTimeInputProps {
    bind: BindComponentRenderProp<Date>;
}

export const WbSchedulerDialogFormComponentDateTimeInput = makeDecoratable(
    "WbSchedulerDialogFormComponentDateTimeInput",
    (props: IWbSchedulerDialogFormComponentDateTimeInputProps) => {
        const { bind } = props;

        return (
            <Input
                {...bind}
                value={formatDateForDateTimeLocal(bind.value)}
                title={"Schedule On"}
                label={"Schedule On"}
                size={"lg"}
                type={"datetime-local"}
                required
                autoFocus
            />
        );
    }
);

const FormComponent = ({ scheduleOn, type }: FormComponentProps) => {
    return (
        <>
            {<ReschedulingAlert type={type} scheduleOn={scheduleOn} />}
            <Grid>
                <Grid.Column span={12}>
                    <Bind
                        name={"scheduleOn"}
                        validators={[validation.create("required"), minDateValidator]}
                    >
                        {bind => {
                            return <WbSchedulerDialogFormComponentDateTimeInput bind={bind} />;
                        }}
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
    action: IWbScheduleDialogAction;
    scheduleOn: Date;
    entry: ShowWbDialogParamsEntry;
    type: ScheduleType;
}

export const useWbScheduleDialog = (): UseShowWbScheduleDialogResponse => {
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
                scheduleOn,
                type
            });
            showSnackbar(`Scheduled ${type} action for "${entry.title}"!`);
        } catch (error) {
            showSnackbar(error.message);
            console.error(error);
        }
    }, []);

    const showDialog = (params: ShowWbDialogParams) => {
        const { schedulerEntry, entry } = params;

        const scheduleOn = schedulerEntry?.publishOn || schedulerEntry?.unpublishOn;

        dialogClose.current = dialog.showDialog({
            title: `Schedule "${entry.title}"`,
            content: <FormComponent type={schedulerEntry?.type} scheduleOn={scheduleOn} />,
            formData: {
                scheduleOn
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
                    showSnackbar(`Invalid "Schedule On" date!`, {
                        value: data.scheduleOn
                    });
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
