import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Text, IconButton, cn } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { Buttons } from "~/components/Buttons/index.js";
import { useListView } from "./context.js";

export interface ListViewBulkActionsProps {
    itemLabel: string;
    itemLabelPlural?: string;
    actions: React.ComponentProps<typeof Buttons>["actions"];
}

const ListViewBulkActions = observer(
    ({ itemLabel, itemLabelPlural, actions: bulkActions }: ListViewBulkActionsProps) => {
        const { list, actions } = useListView();

        const selectedCount = list.selection.selectedCount;
        const plural = itemLabelPlural ?? `${itemLabel}s`;

        const headline = useMemo((): string => {
            const label = selectedCount === 1 ? itemLabel : plural;
            return `${selectedCount} ${label} selected`;
        }, [selectedCount, itemLabel, plural]);

        return (
            <div
                className={cn(
                    "w-full bg-neutral-disabled px-md py-sm",
                    selectedCount > 0 ? "block" : "hidden"
                )}
            >
                <div className={"flex items-center justify-between gap-sm"}>
                    <div className={"flex items-center gap-sm"}>
                        <Text size={"sm"} className={"text-neutral-strong"}>
                            {headline}
                        </Text>
                    </div>
                    <div className={"flex items-center gap-sm"}>
                        <Buttons actions={bulkActions} />
                        <IconButton
                            variant={"ghost"}
                            size={"sm"}
                            icon={<Close />}
                            onClick={() => actions.selection.deselectAll()}
                        />
                    </div>
                </div>
            </div>
        );
    }
);

export { ListViewBulkActions };
