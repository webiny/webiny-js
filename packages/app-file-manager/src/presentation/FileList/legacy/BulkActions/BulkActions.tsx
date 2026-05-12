// @ts-nocheck
import React, { useMemo } from "react";
import { Text, IconButton } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { Buttons } from "@webiny/app-admin";

import { useFileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";

const t = i18n.ns("app-file-manager/components/bulk-actions");

export const getFilesLabel = (count = 0): string => {
    return `${count} ${count === 1 ? "file" : "files"}`;
};

export const BulkActions = () => {
    const { browser } = useFileManagerViewConfig();
    const view = useFileManagerView();

    const headline = useMemo((): string => {
        return t`{label} selected`({
            label: getFilesLabel(view.selected.length)
        });
    }, [view.selected]);

    if (view.hasOnSelectCallback || !view.selected.length) {
        return null;
    }

    return (
        <div className={"wby-w-full wby-bg-neutral-disabled wby-px-md wby-py-sm"}>
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
                        onClick={() => view.setSelected([])}
                    />
                </div>
            </div>
        </div>
    );
};
