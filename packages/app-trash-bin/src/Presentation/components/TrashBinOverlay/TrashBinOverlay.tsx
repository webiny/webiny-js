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
import { useTrashBin } from "~/Presentation/hooks";

interface TrashBinOverlayProps {
    title: string;
    onExited: () => void;
}

export const TrashBinOverlay = (props: TrashBinOverlayProps) => {
    const { listMoreItems, vm } = useTrashBin();

    const onTableScroll = debounce(async ({ scrollFrame }) => {
        if (scrollFrame.top > 0.8) {
            await listMoreItems();
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
                {vm.isEmptyView ? <Empty /> : <Table />}
            </Scrollbar>
            <BottomInfoBar />
        </OverlayLayout>
    );
};
