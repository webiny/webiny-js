import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { useSecurity } from "@webiny/app-admin";
import { Tooltip } from "@webiny/ui/Tooltip/index.js";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons/index.js";
import type { UserItem } from "~/UserItem.js";

const t = i18n.ns("app-identity/admin/users/data-list");

export interface DeleteActionProps {
    item: UserItem;
    onClick: () => void;
}

export const DeleteAction = ({ item, onClick }: DeleteActionProps) => {
    const { identity } = useSecurity();

    if (identity.id === item.id) {
        return (
            <Tooltip
                placement={"bottom"}
                content={<span>{t`You can't delete your own user account.`}</span>}
            >
                <DeleteIcon disabled />
            </Tooltip>
        );
    }

    if (item.external) {
        return (
            <Tooltip
                placement={"bottom"}
                content={<span>{t`You can't delete external users.`}</span>}
            >
                <DeleteIcon disabled />
            </Tooltip>
        );
    }

    return <DeleteIcon onClick={onClick} data-testid={"default-data-list.delete"} />;
};
