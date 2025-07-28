import React from "react";
import { Separator } from "@webiny/admin-ui";
import { ListMeta } from "./ListMeta";
import { ListStatus } from "./ListStatus";
import { useDocumentList } from "~/modules/pages/PagesList/useDocumentList.js";

export const BottomInfoBar = () => {
    const { vm } = useDocumentList();

    return (
        <div className="wby-sticky wby-bottom-0 wby-z-5 wby-bg-neutral-base wby-w-full wby-transform wby-translate-z-0 wby-overflow-hidden">
            <Separator />
            <div
                className={
                    "wby-h-xl wby-px-md wby-py-sm wby-flex wby-items-center wby-justify-between"
                }
            >
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
