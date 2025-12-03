import React from "react";
import { Separator } from "@webiny/admin-ui";
import { ListMeta } from "./ListMeta.js";
import { ListStatus } from "./ListStatus.js";
import { LoadingActions } from "~/types.js";
import { useTrashBin } from "~/Presentation/hooks/index.js";

export const BottomInfoBar = () => {
    const { vm } = useTrashBin();

    return (
        <div className="sticky bottom-0 z-5 bg-neutral-base w-full transform translate-z-0 overflow-hidden">
            <Separator />
            <div className={"h-xl px-md py-sm flex items-center justify-between"}>
                <ListMeta
                    loading={vm.loading[LoadingActions.list]}
                    totalCount={vm.meta.totalCount}
                    currentCount={vm.items.length}
                />
                <ListStatus loading={vm.loading[LoadingActions.listMore]} />
            </div>
        </div>
    );
};
