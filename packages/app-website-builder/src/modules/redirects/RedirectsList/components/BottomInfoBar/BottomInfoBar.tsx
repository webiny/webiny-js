import React from "react";
import { Separator } from "@webiny/admin-ui";
import { ListMeta } from "./ListMeta.js";
import { ListStatus } from "./ListStatus.js";
import { useDocumentList } from "~/modules/redirects/RedirectsList/useDocumentList.js";

export const BottomInfoBar = () => {
    const { vm } = useDocumentList();

    return (
        <div className="sticky bottom-0 z-5 bg-neutral-base w-full transform translate-z-0 overflow-hidden">
            <Separator />
            <div className={"h-xl px-md py-sm flex items-center justify-between"}>
                <ListMeta
                    loading={vm.isLoading}
                    totalCount={vm.meta.totalCount}
                    currentCount={vm.meta.currentCount}
                />
                <ListStatus loading={vm.isLoadingMore} />
            </div>
        </div>
    );
};
