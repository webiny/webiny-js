import React from "react";
import debounce from "lodash/debounce";
import { OverlayLayout } from "@webiny/app-admin";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Title } from "~/Presentation/components/Title";
import { SearchInput } from "~/Presentation/components/SearchInput";
import { BulkActions } from "~/Presentation/components/BulkActions";
import { Empty } from "~/Presentation/components/Empty";
import { Table } from "~/Presentation/components/Table";
import { BottomInfoBar } from "~/Presentation/components/BottomInfoBar";
import { ITrashBinControllers, TrashBinPresenterViewModel } from "~/Presentation/abstractions";

interface TrashBinOverlayProps {
    vm: TrashBinPresenterViewModel;
    controllers: ITrashBinControllers;
    title: string;
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
            barLeft={<Title title={props.title} />}
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
            <BottomInfoBar />
        </OverlayLayout>
    );
};
