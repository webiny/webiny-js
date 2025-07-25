import React from "react";
import { ListMeta } from "./ListMeta";
import { ListStatus } from "./ListStatus";
import { BottomInfoBarInner, BottomInfoBarWrapper } from "./BottomInfoBar.styled";
import { LoadingActions } from "~/types";
import { useScheduler } from "~/Presentation/hooks";

export const BottomInfoBar = () => {
    const { vm } = useScheduler();

    return (
        <BottomInfoBarWrapper>
            <BottomInfoBarInner>
                <ListMeta
                    loading={vm.loading[LoadingActions.list]}
                    totalCount={vm.meta.totalCount}
                    currentCount={vm.items.length}
                />
                <ListStatus loading={vm.loading[LoadingActions.listMore]} />
            </BottomInfoBarInner>
        </BottomInfoBarWrapper>
    );
};
