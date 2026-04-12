import React, { useCallback, useMemo, useRef } from "react";
import { Alert, Button, Grid, Input } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { Bind, type BindComponentRenderProp } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ScheduleActionType } from "~/types.js";
import type { Validator } from "@webiny/validation/types.js";
import ValidationError from "@webiny/validation/validationError.js";
import { makeDecoratable } from "@webiny/react-composition";
import ApolloClient from "apollo-client/ApolloClient.js";
import { SchedulerCancelGraphQLGateway } from "~/Gateways/SchedulerCancelGraphQLGateway.js";
import { SchedulerPublishGraphQLGateway } from "~/Gateways/SchedulerPublishGraphQLGateway.js";
import { SchedulerUnpublishGraphQLGateway } from "~/Gateways/SchedulerUnpublishGraphQLGateway.js";
import { SchedulerGetGraphQLGateway } from "~/Gateways/SchedulerGetGraphQLGateway.js";
import { ScheduleDialogPresenter } from "~/Presenter/ScheduleDialog/ScheduleDialogPresenter.js";

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
    scheduleOn: Date | undefined;
    actionType: ScheduleActionType | undefined;
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

export interface ISchedulerDialogFormComponentDateTimeInputProps {
    bind: BindComponentRenderProp<Date>;
}

interface ICancelButtonComponentProps {
    enabled: boolean;
    onCancel: OnCancelCallable;
}
const CancelButtonComponent = ({ enabled, onCancel }: ICancelButtonComponentProps) => {
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
};

export const SchedulerDialogFormComponentDateTimeInput = makeDecoratable(
    "SchedulerDialogFormComponentDateTimeInput",
    (props: ISchedulerDialogFormComponentDateTimeInputProps) => {
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

const FormComponent = ({ scheduleOn, actionType }: FormComponentProps) => {
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
};

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
    client: ApolloClient<object>;
    namespace: string;
    target: IShowDialogParamsEntry;
}

export const useScheduleDialog = (
    props: IUseScheduleDialogProps
): UseShowScheduleDialogResponse => {
    const { client, target, namespace } = props;
    const dialog = useDialogs();
    const { showSnackbar } = useSnackbar();

    const presenter = useMemo(() => {
        return new ScheduleDialogPresenter({
            getGateway: new SchedulerGetGraphQLGateway(client),
            cancelGateway: new SchedulerCancelGraphQLGateway(client),
            publishGateway: new SchedulerPublishGraphQLGateway(client),
            unpublishGateway: new SchedulerUnpublishGraphQLGateway(client)
        });
    }, [client]);

    const dialogClose = useRef<null | (() => void)>(() => {
        return;
    });

    const onAccept = useCallback(async (params: IOnAcceptParams) => {
        const { scheduleOn, actionType } = params;

        try {
            await presenter.schedule({
                targetId: target.id,
                namespace,
                scheduleOn,
                actionType
            });
            showSnackbar(`Scheduled ${actionType} action for "${target.title}"!`);
        } catch (error) {
            showSnackbar(error.message);
            console.error(error);
        }
    }, [presenter.vm]);

    const onCancel = useCallback(async () => {
        const entry = presenter.vm.entry;
        if (!entry) {
            showSnackbar(`No scheduled action found for "${target.title}"!`);
            if (dialogClose.current) {
                dialogClose.current();
                dialogClose.current = null;
            }
            return;
        }
        try {
            await presenter.cancel({
                id: entry.id,
                namespace: entry.namespace
            });
            showSnackbar(
                `Canceled scheduled ${entry.actionType} on "${entry.title}"!`
            );
        } catch (error) {
            showSnackbar(error.message);
        }
        if (!dialogClose.current) {
            return;
        }
        dialogClose.current();
        dialogClose.current = null;
    }, [presenter.vm]);

    const showDialog = async () => {
        await presenter.load({ namespace, id: target.id });

        const isPublished = target.status === "published";
        const entry = presenter.vm.entry;
        const scheduleOn = entry?.publishOn || entry?.unpublishOn;

        dialogClose.current = dialog.showDialog({
            title: `Schedule "${target.title}"`,
            content: (
                <FormComponent actionType={entry?.actionType} scheduleOn={scheduleOn} />
            ),
            formData: {
                scheduleOn
            },
            acceptLabel: isPublished ? "Schedule Unpublish" : "Schedule Publish",
            cancelLabel: "Discard",
            loadingLabel: "Scheduling...",
            info: <CancelButtonComponent enabled={!!scheduleOn} onCancel={onCancel} />,
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
