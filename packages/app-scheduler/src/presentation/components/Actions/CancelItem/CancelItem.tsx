import React from "react";
import { ReactComponent as Cancel } from "@webiny/icons/delete.svg";
import { OptionsMenuItem } from "@webiny/app-admin/exports/admin/ui.js";
import { useCancelSchedulerItem, useSchedulerItem } from "~/presentation/hooks/index.js";

export const CancelItemAction = () => {
    const { item } = useSchedulerItem();
    const { openDialogCancelSchedulerItem } = useCancelSchedulerItem({ item });

    return (
        <OptionsMenuItem
            icon={<Cancel />}
            label={"Cancel"}
            onAction={openDialogCancelSchedulerItem}
        />
    );
};
