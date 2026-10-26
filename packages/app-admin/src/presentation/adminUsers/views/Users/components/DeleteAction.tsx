import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { useSecurity } from "~/presentation/security/hooks/useSecurity.js";
import { Tooltip, DeleteIcon } from "@webiny/admin-ui";
import type { UserItem } from "~/presentation/adminUsers/UserItem.js";

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
                side={"bottom"}
                content={<span>{t`You can't delete your own user account.`}</span>}
                trigger={<DeleteIcon disabled />}
            />
        );
    }

    if (item.external) {
        return (
            <Tooltip
                side={"bottom"}
                content={<span>{t`You can't delete external users.`}</span>}
                trigger={<DeleteIcon disabled />}
            />
        );
    }

    return <DeleteIcon onClick={onClick} data-testid={"default-data-list.delete"} />;
};
