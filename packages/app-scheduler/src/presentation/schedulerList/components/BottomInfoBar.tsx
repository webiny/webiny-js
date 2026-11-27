import React from "react";
import { observer } from "mobx-react-lite";
import { ListMeta } from "~/presentation/components/BottomInfoBar/ListMeta.js";
import { ListStatus } from "~/presentation/components/BottomInfoBar/ListStatus.js";
import type { ISchedulerListPresenter } from "../abstractions.js";

interface BottomInfoBarProps {
    presenter: ISchedulerListPresenter;
}

export const BottomInfoBar = observer(({ presenter }: BottomInfoBarProps) => {
    const { vm } = presenter.list;

    return (
        <div
            className={
                "sticky bottom-0 z-1 flex items-center w-full h-[30px] overflow-hidden translate-z-0 text-[0.8rem]"
            }
        >
            <div className={"w-full px-sm-plus"}>
                <ListMeta
                    loading={vm.pagination.loading}
                    totalCount={vm.pagination.totalCount}
                    currentCount={vm.pagination.currentCount}
                />
                <ListStatus loading={vm.pagination.loadingMore} />
            </div>
        </div>
    );
});
