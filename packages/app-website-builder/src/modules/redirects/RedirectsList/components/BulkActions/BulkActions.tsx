import React, { useMemo } from "react";
import { Text, IconButton, cn } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { Buttons } from "@webiny/app-admin";
import { observer } from "mobx-react-lite";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/RedirectListPresenterProvider.js";
import { useRedirectListConfig } from "~/modules/redirects/configs/index.js";

export const getRedirectsLabel = (count = 0): string => {
    return `${count} ${count === 1 ? "redirect" : "redirects"}`;
};

export const BulkActions = observer(() => {
    const { browser } = useRedirectListConfig();
    const { vm, actions } = useRedirectListPresenter();

    const selectedCount = vm.list.selection.selectedCount;

    const headline = useMemo((): string => {
        const label = getRedirectsLabel(selectedCount);
        return `${label} selected`;
    }, [selectedCount]);

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
