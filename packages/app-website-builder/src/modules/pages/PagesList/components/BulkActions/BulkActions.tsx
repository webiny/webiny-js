import React, { useMemo } from "react";
import { Text, IconButton, cn } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { Buttons } from "@webiny/app-admin";
import { useDocumentList } from "~/modules/pages/PagesList/useDocumentList.js";
import { useSelectPages } from "~/features/pages/selectPages/useSelectPages.js";
import { usePageListConfig } from "~/configs/index.js";

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
                "wby-w-full wby-bg-neutral-disabled wby-px-md wby-py-sm",
                vm.selected.length > 0 ? "wby-block" : "wby-hidden"
            )}
        >
            <div className={"wby-flex wby-items-center wby-justify-between wby-gap-sm"}>
                <div className={"wby-flex wby-items-center wby-gap-sm"}>
                    <Text size={"sm"} className={"wby-text-neutral-strong"}>
                        {headline}
                    </Text>
                </div>

                <div className={"wby-flex wby-items-center wby-gap-sm"}>
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
