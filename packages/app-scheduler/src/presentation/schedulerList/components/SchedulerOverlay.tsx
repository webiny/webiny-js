import React from "react";
import { observer } from "mobx-react-lite";
import debounce from "lodash/debounce.js";
import { OverlayLayout } from "@webiny/app-admin";
import { Scrollbar } from "@webiny/admin-ui";
import { Title } from "~/presentation/components/Title/index.js";
import { SearchInput } from "./SearchInput.js";
import { Empty } from "./Empty.js";
import { SchedulerTable } from "./SchedulerTable.js";
import { BottomInfoBar } from "./BottomInfoBar.js";
import type { ISchedulerListPresenter } from "../abstractions.js";

interface SchedulerOverlayProps {
    presenter: ISchedulerListPresenter;
    title: string;
    onExited: () => void;
}

export const SchedulerOverlay = observer(
    ({ presenter, title, onExited }: SchedulerOverlayProps) => {
        const { vm } = presenter.list;

        const onTableScroll = debounce(async ({ scrollFrame }) => {
            if (scrollFrame.top > 0.8) {
                await presenter.list.actions.loadMore();
            }
        }, 200);

        return (
            <OverlayLayout
                onExited={onExited}
                barLeft={<Title title={title} />}
                barMiddle={<SearchInput presenter={presenter} />}
            >
                <Scrollbar onScrollFrame={scrollFrame => onTableScroll({ scrollFrame })}>
                    {vm.empty ? (
                        <Empty presenter={presenter} />
                    ) : (
                        <SchedulerTable presenter={presenter} />
                    )}
                </Scrollbar>
                <BottomInfoBar presenter={presenter} />
            </OverlayLayout>
        );
    }
);
