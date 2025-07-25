import React from "react";
import debounce from "lodash/debounce";
import { OverlayLayout } from "@webiny/app-admin";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Title } from "~/Presentation/components/Title";
import { SearchInput } from "~/Presentation/components/SearchInput";
import { Empty } from "~/Presentation/components/Empty";
import { Table } from "~/Presentation/components/Table";
import { BottomInfoBar } from "~/Presentation/components/BottomInfoBar";
import { useScheduler } from "~/Presentation/hooks";

interface SchedulerOverlayProps {
    title: string;
    onExited: () => void;
}

export const SchedulerOverlay = (props: SchedulerOverlayProps) => {
    const { listMoreItems, vm } = useScheduler();

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
            <Scrollbar onScrollFrame={scrollFrame => onTableScroll({ scrollFrame })}>
                {vm.isEmptyView ? <Empty /> : <Table />}
            </Scrollbar>
            <BottomInfoBar />
        </OverlayLayout>
    );
};
