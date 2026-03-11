import React from "react";
import debounce from "lodash/debounce.js";
import { OverlayLayout } from "@webiny/app-admin";
import { Scrollbar } from "@webiny/ui/Scrollbar/index.js";
import { Title } from "~/Presentation/components/Title/index.js";
import { SearchInput } from "~/Presentation/components/SearchInput/index.js";
import { Empty } from "~/Presentation/components/Empty/index.js";
import { Table } from "~/Presentation/components/Table/index.js";
import { BottomInfoBar } from "~/Presentation/components/BottomInfoBar/index.js";
import { useScheduler } from "~/Presentation/hooks/index.js";

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
