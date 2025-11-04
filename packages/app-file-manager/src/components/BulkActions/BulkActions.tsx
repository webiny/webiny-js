import React, { useMemo } from "react";
import { Text, IconButton } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { Buttons } from "@webiny/app-admin";

import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
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
        <div className={"w-full bg-neutral-disabled px-md py-sm"}>
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
                        onClick={() => view.setSelected([])}
                    />
                </div>
            </div>
        </div>
    );
};
