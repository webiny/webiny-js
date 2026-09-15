import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import type { IScheduleDialogPresenter } from "../abstractions.js";

interface ICancelButtonComponentProps {
    presenter: IScheduleDialogPresenter;
    onCancel: () => Promise<void>;
}

export const CancelButtonComponent = observer(
    ({ presenter, onCancel }: ICancelButtonComponentProps) => {
        const { entry } = presenter.vm;
        const scheduleOn = entry?.publishOn || entry?.unpublishOn;

        if (!scheduleOn) {
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
    }
);
