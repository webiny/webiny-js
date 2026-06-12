import React, { useMemo } from "react";
import { Text, IconButton, cn } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { Buttons } from "@webiny/app-admin";
import { useDocumentList } from "~/presentation/pages/PageList/components/useDocumentList.js";
import { useSelectPages } from "~/features/pages/selectPages/useSelectPages.js";
import { usePageListConfig } from "~/presentation/pages/PageList/configs/index.js";

export const getPagesLabel = (count = 0): string => {
    return `${count} ${count === 1 ? "page" : "pages"}`;
};

export const BulkActions = () => {
    const { browser } = usePageListConfig();
    const { vm } = useDocumentList();
    const { selectPages } = useSelectPages();

    const headline = useMemo((): string => {
        const label = getPagesLabel(vm.selected.length);
        return `${label} selected`;
    }, [vm.selected]);

    return (
        <div
            className={cn(
                "w-full bg-neutral-disabled px-md py-sm",
                vm.selected.length > 0 ? "block" : "hidden"
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
                        onClick={() => selectPages([])}
                    />
                </div>
            </div>
        </div>
    );
};
