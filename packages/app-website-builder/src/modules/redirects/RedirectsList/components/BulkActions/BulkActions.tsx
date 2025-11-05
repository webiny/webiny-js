import React, { useMemo } from "react";
import { Text, IconButton, cn } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { Buttons } from "@webiny/app-admin";
import { useDocumentList } from "~/modules/redirects/RedirectsList/useDocumentList.js";
import { useSelectRedirects } from "~/features/redirects/selectRedirects/useSelectRedirects.js";
import { useRedirectListConfig } from "~/modules/redirects/configs/index.js";

export const getRedirectsLabel = (count = 0): string => {
    return `${count} ${count === 1 ? "redirect" : "redirects"}`;
};

export const BulkActions = () => {
    const { browser } = useRedirectListConfig();
    const { vm } = useDocumentList();
    const { selectRedirects } = useSelectRedirects();

    const headline = useMemo((): string => {
        const label = getRedirectsLabel(vm.selected.length);
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
                        onClick={() => selectRedirects([])}
                    />
                </div>
            </div>
        </div>
    );
};
