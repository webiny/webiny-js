import React from "react";
import { Separator } from "@webiny/admin-ui";
import { ListMeta } from "./ListMeta.js";
import { ListStatus } from "./ListStatus.js";
import { observer } from "mobx-react-lite";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/RedirectListPresenterProvider.js";

export const BottomInfoBar = observer(() => {
    const { vm } = useRedirectListPresenter();

    return (
        <div className="sticky bottom-0 z-5 bg-neutral-base w-full transform translate-z-0 overflow-hidden">
            <Separator />
            <div className={"h-xl px-md py-sm flex items-center justify-between"}>
                <ListMeta
                    loading={vm.list.pagination.loading}
                    totalCount={vm.list.pagination.totalCount}
                    currentCount={vm.list.pagination.currentCount}
                />
                <ListStatus loading={vm.list.pagination.loadingMore} />
            </div>
        </div>
    );
});
