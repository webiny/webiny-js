import React from "react";
import { ListMeta } from "./ListMeta";
import { ListStatus } from "./ListStatus";
import { BottomInfoBarInner, BottomInfoBarWrapper } from "./BottomInfoBar.styled";
import { TrashBinPresenterViewModel } from "~/components/TrashBin/abstractions";

interface BottomInfoBarProps {
    vm: TrashBinPresenterViewModel;
}

export const BottomInfoBar = (props: BottomInfoBarProps) => {
    return (
        <BottomInfoBarWrapper>
            <BottomInfoBarInner>
                <ListMeta
                    loading={props.vm.loading["INIT"]}
                    totalCount={props.vm.meta.totalCount}
                    currentCount={props.vm.items.length}
                />
                <ListStatus loading={props.vm.loading["LIST_MORE"]} {...props} />
            </BottomInfoBarInner>
        </BottomInfoBarWrapper>
    );
};
