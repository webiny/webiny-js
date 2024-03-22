import React from "react";
import debounce from "lodash/debounce";
import { OverlayLayout } from "@webiny/app-admin";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Title } from "~/components/Title";
import { Table } from "~/components/Table";
import { BulkActions } from "~/components/BulkActions";
import { BottomInfoBar } from "~/components/BottomInfoBar";
import { Empty } from "~/components/Empty";
import { SearchInput } from "~/components/SearchInput";
import {
    ITrashBinUseControllers,
    TrashBinPresenterViewModel
} from "~/components/TrashBin/abstractions";

interface TrashBinOverlayProps {
    vm: TrashBinPresenterViewModel;
    controllers: ITrashBinUseControllers;
    onExited: () => void;
}

export const TrashBinOverlay = (props: TrashBinOverlayProps) => {
    const onTableScroll = debounce(async ({ scrollFrame }) => {
        if (scrollFrame.top > 0.8) {
            await props.controllers.listMoreItems.execute();
        }
    }, 200);

    return (
        <OverlayLayout
            onExited={props.onExited}
            barLeft={<Title title={"Trash bin"} />}
            barMiddle={<SearchInput />}
        >
            <BulkActions />
            <Scrollbar onScrollFrame={scrollFrame => onTableScroll({ scrollFrame })}>
                {props.vm.isEmptyView ? (
                    <Empty />
                ) : (
                    <Table vm={props.vm} controllers={props.controllers} />
                )}
            </Scrollbar>
            <BottomInfoBar vm={props.vm} />
        </OverlayLayout>
    );
};
