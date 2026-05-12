import React, { useMemo } from "react";
import { Text, IconButton, cn } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { Buttons } from "@webiny/app-admin";
import { observer } from "mobx-react-lite";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";
import { useFileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";

export const getFilesLabel = (count = 0): string => {
    return `${count} ${count === 1 ? "file" : "files"}`;
};

export const BulkActionBar = observer(function BulkActionBar() {
    const { browser } = useFileManagerViewConfig();
    const { vm, actions } = useFileManagerPresenter();

    const selectedCount = vm.list.selection.selectedCount;

    const headline = useMemo((): string => {
        const label = getFilesLabel(selectedCount);
        return `${label} selected`;
    }, [selectedCount]);

    if (vm.isOverlay || selectedCount === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                "w-full bg-neutral-disabled px-md py-sm",
                selectedCount > 0 ? "block" : "hidden"
            )}
        >
            <div className={"flex items-center justify-between gap-sm"}>
                <div className={"flex items-center gap-sm"}>
                    <Text size={"sm"} className={"text-neutral-strong"}>
                        {headline}
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
