import React, { useMemo } from "react";
import debounce from "lodash/debounce.js";
import { observer } from "mobx-react-lite";
import { Scrollbar, Text, IconButton, Loader, Separator } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { OverlayLayout } from "~/components/OverlayLayout/OverlayLayout.js";
import { Buttons } from "~/components/Buttons/index.js";
import { DelayedOnChange, Input, Icon } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { TrashBinTable } from "./TrashBinTable.js";
import { useTrashBinPresenter, TrashBinProvider, type TrashBinContext } from "../hooks/index.js";
import { useTrashBinListConfig, TrashBinListWithConfig } from "../configs/index.js";
import { CompositionScope } from "@webiny/react-composition";
import type { ITrashBinPresenter, TrashBinItem } from "../abstractions.js";

interface TrashBinOverlayProps {
    presenter: ITrashBinPresenter;
    onExited: () => void;
    onItemAfterRestore?: (item: TrashBinItem) => Promise<void>;
}

const SearchInput = observer(() => {
    const { vm, actions } = useTrashBinPresenter();

    return (
        <DelayedOnChange
            value={vm.list.search}
            onChange={value => {
                const searchQuery = value.trim();
                if (searchQuery === vm.list.search) {
                    return;
                }
                if (!searchQuery) {
                    actions.search.clear();
                    return;
                }
                actions.search.set(searchQuery);
            }}
        >
            {({ value, onChange }) => (
                <Input
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    forwardEventOnChange={true}
                    placeholder={"Search all items"}
                    startIcon={<Icon icon={<SearchIcon />} label="Search" />}
                    size={"md"}
                    variant={"ghost"}
                    className={"w-full"}
                />
            )}
        </DelayedOnChange>
    );
});

const BulkActionsBar = observer(() => {
    const { vm, actions } = useTrashBinPresenter();
    const { browser } = useTrashBinListConfig();

    const selectedCount = vm.list.selection.selectedCount;

    if (selectedCount === 0) {
        return null;
    }

    const label = selectedCount === 1 ? "item" : "items";

    return (
        <div className={"w-full bg-neutral-disabled px-md py-sm"}>
            <div className={"flex items-center justify-between gap-sm"}>
                <div className={"flex items-center gap-sm"}>
                    <Text size={"sm"} className={"text-neutral-strong"}>
                        {`${selectedCount} ${label} selected`}
                    </Text>
                </div>
                <div className={"flex items-center gap-sm"}>
                    <Buttons actions={browser.bulkActions} />
                    <IconButton
                        variant={"ghost"}
                        size={"sm"}
                        icon={<Close />}
                        onClick={() => actions.selection.deselectAll()}
                    />
                </div>
            </div>
        </div>
    );
});

const BottomBar = observer(() => {
    const { vm } = useTrashBinPresenter();
    const { loading, totalCount, currentCount, loadingMore } = vm.list.pagination;

    if (loading) {
        return null;
    }

    return (
        <div className="sticky bottom-0 z-5 bg-neutral-base w-full transform translate-z-0 overflow-hidden">
            <Separator />
            <div className={"h-xl px-md py-sm flex items-center justify-between"}>
                <Text
                    size={"sm"}
                    as={"div"}
                    className={"text-neutral-strong"}
                >{`Showing ${currentCount} out of ${totalCount} items.`}</Text>
                {loadingMore ? (
                    <div className="flex items-center gap-sm">
                        <Text size={"sm"} as={"div"} className={"text-neutral-strong"}>
                            Loading more items...
                        </Text>
                        <Loader size={"xs"} />
                    </div>
                ) : null}
            </div>
        </div>
    );
});

const TrashBinOverlayContent = observer(
    ({
        onExited,
        presenter
    }: {
        onExited: () => void;
        presenter: ITrashBinPresenter;
    }) => {
        const onTableScroll = useMemo(
            () =>
                debounce(async (scrollFrame: { top: number }) => {
                    if (scrollFrame.top > 0.8) {
                        await presenter.actions.loadMore();
                    }
                }, 200),
            [presenter]
        );

        return (
            <OverlayLayout
                onExited={onExited}
                barLeft={
                    <Text size={"lg"} className={"font-semibold"}>
                        {presenter.vm.title}
                    </Text>
                }
                barMiddle={<SearchInput />}
            >
                <BulkActionsBar />
                <Scrollbar onScrollFrame={scrollFrame => onTableScroll(scrollFrame)}>
                    <TrashBinTable />
                </Scrollbar>
                <BottomBar />
            </OverlayLayout>
        );
    }
);

export const TrashBinOverlay = observer(
    ({ presenter, onExited, onItemAfterRestore }: TrashBinOverlayProps) => {
        const ctx: TrashBinContext = {
            vm: presenter.vm,
            actions: presenter.actions,
            onItemAfterRestore
        };

        return (
            <CompositionScope name={"trash"}>
                <TrashBinListWithConfig>
                    <TrashBinProvider {...ctx}>
                        <TrashBinOverlayContent onExited={onExited} presenter={presenter} />
                    </TrashBinProvider>
                </TrashBinListWithConfig>
            </CompositionScope>
        );
    }
);
