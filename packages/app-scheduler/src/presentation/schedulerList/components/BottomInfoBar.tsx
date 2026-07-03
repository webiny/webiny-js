import React from "react";
import { observer } from "mobx-react-lite";
import { ListMeta } from "~/presentation/components/BottomInfoBar/ListMeta.js";
import { ListStatus } from "~/presentation/components/BottomInfoBar/ListStatus.js";
import {
    BottomInfoBarInner,
    BottomInfoBarWrapper
} from "~/presentation/components/BottomInfoBar/BottomInfoBar.styled.js";
import type { ISchedulerListPresenter } from "../abstractions.js";

interface BottomInfoBarProps {
    presenter: ISchedulerListPresenter;
}

export const BottomInfoBar = observer(({ presenter }: BottomInfoBarProps) => {
    const { vm } = presenter.list;

    return (
        <BottomInfoBarWrapper>
            <BottomInfoBarInner>
                <ListMeta
                    loading={vm.pagination.loading}
                    totalCount={vm.pagination.totalCount}
                    currentCount={vm.pagination.currentCount}
                />
                <ListStatus loading={vm.pagination.loadingMore} />
            </BottomInfoBarInner>
        </BottomInfoBarWrapper>
    );
});
