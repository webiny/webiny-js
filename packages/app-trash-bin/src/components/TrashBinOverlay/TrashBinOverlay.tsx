import React from "react";
import debounce from "lodash/debounce";
import { OverlayLayout } from "@webiny/app-admin";
import {
    ISortController,
    ITrashBinController,
    TrashBinPresenterViewModel
} from "@webiny/app-trash-bin-common";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Title } from "~/components/Title";
import { Table } from "~/components/Table";
import { BulkActions } from "~/components/BulkActions";
import { BottomInfoBar } from "~/components/BottomInfoBar";
import { Empty } from "~/components/Empty";

interface TrashBinOverlayProps {
    vm: TrashBinPresenterViewModel;
    controller: ITrashBinController;
    sortController: ISortController;
    onExited: () => void;
}

export const TrashBinOverlay = (props: TrashBinOverlayProps) => {
    const onTableScroll = debounce(async ({ scrollFrame }) => {
        if (scrollFrame.top > 0.8) {
            await props.controller.listMoreEntries();
        }
    }, 200);

    return (
        <OverlayLayout onExited={props.onExited} barLeft={<Title title={"Trash bin"} />}>
            <BulkActions />
            <Scrollbar onScrollFrame={scrollFrame => onTableScroll({ scrollFrame })}>
                {!props.vm.loading["INIT"] &&
                !props.vm.loading["LIST"] &&
                !props.vm.entries.length ? (
                    <Empty />
                ) : (
                    <Table
                        vm={props.vm}
                        controller={props.controller}
                        sortController={props.sortController}
                    />
                )}
            </Scrollbar>
            <BottomInfoBar vm={props.vm} />
        </OverlayLayout>
    );
};
