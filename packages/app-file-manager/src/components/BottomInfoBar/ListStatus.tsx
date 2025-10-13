import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Loader, Text } from "@webiny/admin-ui";

const t = i18n.ns("app-admin/file-manager/components/bottom-info-bar/list-status");

export interface ListStatusProps {
    listing: boolean;
}

const ListStatus = ({ listing }: ListStatusProps) => {
    if (!listing) {
        return null;
    }

    return (
        <div className="flex items-center gap-sm">
            <Text size={"sm"} as={"div"} className={"text-neutral-strong"}>
                {t`Loading more files...`}
            </Text>
            <Loader size={"xs"} />
        </div>
    );
};

export default ListStatus;
