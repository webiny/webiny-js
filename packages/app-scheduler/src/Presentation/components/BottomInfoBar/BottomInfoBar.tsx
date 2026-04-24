import React from "react";
import { ListMeta } from "./ListMeta.js";
import { ListStatus } from "./ListStatus.js";
import { BottomInfoBarInner, BottomInfoBarWrapper } from "./BottomInfoBar.styled.js";
import { LoadingActions } from "~/types.js";
import { useScheduler } from "~/Presentation/hooks/index.js";

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
