import React from "react";
import { ReactComponent as Cancel } from "@material-design-icons/svg/outlined/delete.svg";
import { useCancelSchedulerItem, useSchedulerItem } from "~/Presentation/hooks";
import { SchedulerListConfig } from "~/Presentation/configs";

export const CancelItemAction = () => {
    const { item } = useSchedulerItem();
    const { openDialogCancelSchedulerItem } = useCancelSchedulerItem({ item });
    const { OptionsMenuItem } = SchedulerListConfig.Browser.EntryAction;

    return (
        <OptionsMenuItem
            icon={<Cancel />}
            label={"Cancel"}
            onAction={openDialogCancelSchedulerItem}
        />
    );
};
