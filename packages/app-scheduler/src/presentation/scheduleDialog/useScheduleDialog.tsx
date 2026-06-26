import React, { useCallback, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useContainer } from "@webiny/app";
import { useToast } from "@webiny/admin-ui";
import { Alert, Button, Grid, DatePicker } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { useDialogs } from "@webiny/app-admin";
import { Bind, type BindComponentRenderProp } from "@webiny/form";
import { validation } from "@webiny/validation";
import type { Validator } from "@webiny/validation/types.js";
import ValidationError from "@webiny/validation/validationError.js";
import { makeDecoratable } from "@webiny/react-composition";
import { ScheduleActionType } from "~/types.js";
import { ScheduleDialogPresenter } from "./abstractions.js";
import type { IScheduleDialogPresenter } from "./abstractions.js";

export type ShowDialogParamsEntryStatus = "published" | "unpublished" | "draft" | string;

export interface IShowDialogParamsEntry {
    id: string;
    status: ShowDialogParamsEntryStatus;
    title: string;
}

interface UseShowScheduleDialogResponse {
    showDialog: () => void;
}

interface FormComponentProps {
    presenter: IScheduleDialogPresenter;
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

interface IReschedulingAlertProps {
    scheduleOn: Date | undefined;
    actionType: ScheduleActionType | undefined;
}

const ReschedulingAlert = ({ scheduleOn, actionType }: IReschedulingAlertProps) => {
    if (!scheduleOn || !actionType) {
        return null;
    }
    const actionName = actionType === ScheduleActionType.publish ? "publish" : "unpublish";
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

export interface ISchedulerDialogFormComponentDateTimeInputProps {
    bind: BindComponentRenderProp<Date>;
}

interface ICancelButtonComponentProps {
    presenter: IScheduleDialogPresenter;
    onCancel: OnCancelCallable;
}
const CancelButtonComponent = observer(({ presenter, onCancel }: ICancelButtonComponentProps) => {
    const { entry } = presenter.vm;
    const scheduleOn = entry?.publishOn || entry?.unpublishOn;
    const enabled = !!scheduleOn;

    if (!enabled) {
        return null;
    }
    return (
        <Button
            variant="ghost"
            onClick={onCancel}
            text={"Cancel Schedule"}
            size="md"
            icon={<DeleteIcon />}
            iconPosition="start"
        />
    );
});

export const SchedulerDialogFormComponentDateTimeInput = makeDecoratable(
    "SchedulerDialogFormComponentDateTimeInput",
    (props: ISchedulerDialogFormComponentDateTimeInputProps) => {
        const { bind } = props;

        return <DatePicker {...bind} type={"dateTimeLocal"} label={"Schedule On"} size={"lg"} />;
    }
);

const FormComponent = observer(({ presenter }: FormComponentProps) => {
    const { entry } = presenter.vm;
    const scheduleOn = entry?.publishOn || entry?.unpublishOn;
    const actionType = entry?.actionType;

    return (
        <>
            {<ReschedulingAlert actionType={actionType} scheduleOn={scheduleOn} />}
            <Grid>
                <Grid.Column span={12}>
                    <Bind
                        name={"scheduleOn"}
                        validators={[validation.create("required"), minDateValidator]}
                    >
                        {bind => {
                            return <SchedulerDialogFormComponentDateTimeInput bind={bind} />;
                        }}
                    </Bind>
                </Grid.Column>
            </Grid>
        </>
    );
});

interface ScheduleFormData {
    scheduleOn?: string;
}

interface IOnAcceptParams {
    scheduleOn: Date;
    actionType: ScheduleActionType;
}

interface OnCancelCallable {
    (): Promise<void>;
}

export interface IUseScheduleDialogProps {
    namespace: string;
    target: IShowDialogParamsEntry;
}

export const useScheduleDialog = (
    props: IUseScheduleDialogProps
): UseShowScheduleDialogResponse => {
    const { target, namespace } = props;
    const container = useContainer();
    const dialog = useDialogs();
    const toast = useToast();

    const presenter = useMemo(() => {
        return container.resolve(ScheduleDialogPresenter);
    }, [container]);

    const dialogClose = useRef<null | (() => void)>(() => {
        return;
    });

    const onAccept = useCallback(
        async (params: IOnAcceptParams) => {
            const { scheduleOn, actionType } = params;

            try {
                await presenter.schedule({
                    targetId: target.id,
                    namespace,
                    scheduleOn,
                    actionType
                });
                toast.showSuccessToast({
                    title: `Scheduled ${actionType} action for "${target.title}"!`
                });
            } catch (error) {
                toast.showWarningToast({ title: error.message });
                console.error(error);
            }
        },
        [presenter.vm]
    );

    const onCancel = useCallback(async () => {
        const entry = presenter.vm.entry;
        if (!entry) {
            toast.showWarningToast({ title: `No scheduled action found for "${target.title}"!` });
            if (dialogClose.current) {
                dialogClose.current();
                dialogClose.current = null;
            }
            return;
        }

        if (dialogClose.current) {
            dialogClose.current();
            dialogClose.current = null;
        }

        try {
            await presenter.cancel({
                id: entry.id,
                namespace: entry.namespace
            });
            toast.showSuccessToast({
                title: `Canceled scheduled ${entry.actionType} on "${entry.title}"!`
            });
        } catch (error) {
            toast.showWarningToast({ title: error.message });
        }
    }, [presenter.vm]);

    const showDialog = async () => {
        const isPublished = target.status === "published";

        dialogClose.current = dialog.showDialog({
            title: `Schedule "${target.title}"`,
            content: <FormComponent presenter={presenter} />,
            formData: async () => {
                await presenter.load({ namespace, id: target.id });

                const entry = presenter.vm.entry;
                const scheduleOn = entry?.publishOn || entry?.unpublishOn;

                return { scheduleOn };
            },
            acceptLabel: isPublished ? "Schedule Unpublish" : "Schedule Publish",
            cancelLabel: "Discard",
            loadingLabel: "Scheduling...",
            dataLoadingLabel: "Checking schedule...",
            info: <CancelButtonComponent presenter={presenter} onCancel={onCancel} />,
            dismissible: false,
            onAccept: (data: Partial<ScheduleFormData>) => {
                if (!data.scheduleOn) {
                    toast.showWarningToast({ title: `Missing "Schedule On" date!` });
                    return;
                }
                let scheduleOn: Date;
                try {
                    scheduleOn = new Date(data.scheduleOn);
                } catch (ex) {
                    toast.showWarningToast({ title: `Invalid "Schedule On" date!` });
                    console.error(ex);
                    return;
                }

                const actionType = isPublished
                    ? ScheduleActionType.unpublish
                    : ScheduleActionType.publish;

                return onAccept({
                    scheduleOn,
                    actionType
                });
            }
        });
    };

    return {
        showDialog
    };
};
