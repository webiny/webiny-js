import React, { useCallback, useMemo, useRef } from "react";
import { useContainer } from "@webiny/app";
import { useToast } from "@webiny/admin-ui";
import { useDialogs } from "@webiny/app-admin";
import { ScheduleActionType } from "~/types.js";
import { ScheduleDialogPresenter } from "./abstractions.js";
import { FormComponent } from "./components/FormComponent.js";
import { CancelButtonComponent } from "./components/CancelButtonComponent.js";

export type ShowDialogParamsEntryStatus = "published" | "unpublished" | "draft" | string;

export interface IShowDialogParamsEntry {
    id: string;
    status: ShowDialogParamsEntryStatus;
    title: string;
}

interface UseShowScheduleDialogResponse {
    showDialog: () => void;
}

interface ScheduleFormData {
    scheduleOn?: string;
}

interface IOnAcceptParams {
    scheduleOn: Date;
    actionType: ScheduleActionType;
}

export interface IUseScheduleDialogProps {
    namespace: string;
    target: IShowDialogParamsEntry;
    /**
     * Called after a scheduled action is successfully created/updated or cancelled. Use it to
     * refresh anything that displays the scheduled state (e.g. list cells, form banners).
     */
    onCompleted?: () => void;
}

export const useScheduleDialog = (
    props: IUseScheduleDialogProps
): UseShowScheduleDialogResponse => {
    const { target, namespace, onCompleted } = props;
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
                onCompleted?.();
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
            onCompleted?.();
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
