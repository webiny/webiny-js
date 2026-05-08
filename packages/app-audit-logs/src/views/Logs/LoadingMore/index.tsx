import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Loader, Text } from "@webiny/admin-ui";

const t = i18n.ns("app-audit-logs/components/table/loading-more");

export const LoadingMore = () => {
    return (
        <div className="absolute bottom-0 left-0 flex w-full items-center justify-center p-xl">
            <div className="mx-auto flex items-center gap-sm rounded-md border border-neutral-dimmed bg-white p-md">
                <Loader size={"xs"} />
                <Text as={"span"}>{t`Loading more records...`}</Text>
            </div>
        </div>
    );
};
