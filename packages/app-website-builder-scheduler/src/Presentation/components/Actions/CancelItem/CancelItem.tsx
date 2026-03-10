import React from "react";
import { ReactComponent as Cancel } from "@material-design-icons/svg/outlined/delete.svg";
import { useCancelWbSchedulerItem, useWbSchedulerItem } from "~/Presentation/hooks/index.js";
import { WbSchedulerListConfig } from "~/Presentation/configs/index.js";

export const CancelItemAction = () => {
    const { item } = useWbSchedulerItem();
    const { openDialogCancelWbSchedulerItem } = useCancelWbSchedulerItem({ item });
    const { OptionsMenuItem } = WbSchedulerListConfig.Browser.EntryAction;

    return (
        <OptionsMenuItem
            icon={<Cancel />}
            label={"Cancel"}
            onAction={openDialogCancelWbSchedulerItem}
        />
    );
};
