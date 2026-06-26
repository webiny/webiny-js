import React from "react";
import { Loader, Separator, Text } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import { useListView } from "./context.js";

export interface ListViewBottomBarProps {
    meta?: { itemLabel: string | { singular: string; plural: string } };
    status?: { loadingText?: string } | true;
}

const Meta = observer(
    ({ itemLabel }: { itemLabel: string | { singular: string; plural: string } }) => {
        const { list } = useListView();
        const { loading, totalCount, currentCount } = list.pagination;

        if (loading) {
            return null;
        }

        const singular = typeof itemLabel === "string" ? itemLabel : itemLabel.singular;
        const plural = typeof itemLabel === "string" ? `${itemLabel}s` : itemLabel.plural;
        const label = totalCount === 1 ? singular : plural;

        return (
            <Text
                size={"sm"}
                as={"div"}
                className={"text-neutral-strong"}
            >{`Showing ${currentCount} out of ${totalCount} ${label}.`}</Text>
        );
    }
);

const Status = observer(({ loadingText }: { loadingText?: string }) => {
    const { list } = useListView();

    if (!list.pagination.loadingMore) {
        return null;
    }

    return (
        <div className="flex items-center gap-sm">
            <Text size={"sm"} as={"div"} className={"text-neutral-strong"}>
                {loadingText ?? "Loading more items..."}
            </Text>
            <Loader size={"xs"} />
        </div>
    );
});

const ListViewBottomBar = ({ meta, status }: ListViewBottomBarProps) => {
    const statusProps = status === true ? {} : status;

    return (
        <div className="sticky bottom-0 z-5 bg-neutral-base w-full transform translate-z-0 overflow-hidden">
            <Separator />
            <div className={"h-xl px-md py-sm flex items-center justify-between"}>
                {meta ? <Meta itemLabel={meta.itemLabel} /> : null}
                {statusProps ? <Status loadingText={statusProps.loadingText} /> : null}
            </div>
        </div>
    );
};

export { ListViewBottomBar };
