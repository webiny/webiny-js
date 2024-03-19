import React from "react";
import { ListMeta } from "./ListMeta";
import { ListStatus } from "./ListStatus";
import { BottomInfoBarInner, BottomInfoBarWrapper } from "./BottomInfoBar.styled";
import { TrashBinPresenterViewModel } from "@webiny/app-trash-bin-common";

interface BottomInfoBarProps {
    vm: TrashBinPresenterViewModel;
}

export const BottomInfoBar = (props: BottomInfoBarProps) => {
    return (
        <BottomInfoBarWrapper>
            <BottomInfoBarInner>
                <ListMeta
                    totalCount={props.vm.meta.totalCount}
                    currentCount={props.vm.entries.length}
                />
                <ListStatus loading={props.vm.loading["LIST_MORE"]} {...props} />
            </BottomInfoBarInner>
        </BottomInfoBarWrapper>
    );
};
