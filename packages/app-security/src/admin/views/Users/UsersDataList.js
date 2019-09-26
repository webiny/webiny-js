import React from "react";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Image } from "@webiny/app/components";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";

import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    ListItemGraphic
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { Avatar } from "@webiny/ui/Avatar";

const t = i18n.ns("app-security/admin/users/data-list");

const UsersDataList = () => {
    const security = useSecurity();
    const { actions, list } = useCrud();
    return (
        <DataList
            {...list}
            title={t`Security Users`}
            sorters={[
                {
                    label: t`Newest to oldest`,
                    sorters: { savedOn: -1 }
                },
                {
                    label: t`Oldest to newest`,
                    sorters: { savedOn: 1 }
                },
                {
                    label: t`Name A-Z`,
                    sorters: { lastName: 1 }
                },
                {
                    label: t`Name Z-A`,
                    sorters: { lastName: -1 }
                }
            ]}
        >
            {({ data, isSelected, select }) => (
                <ScrollList twoLine avatarList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={isSelected(item)}>
                            <ListItemGraphic>
                                <Avatar
                                    renderImage={props => (
                                        <Image {...props} transform={{ width: 100 }} />
                                    )}
                                    src={item.avatar && item.avatar.src}
                                    fallbackText={item.fullName}
                                    alt={t`User's avatar.`}
                                />
                            </ListItemGraphic>
                            <ListItemText onClick={() => select(item)}>
                                {item.fullName}
                                <ListItemTextSecondary>{item.email}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    {security.user && security.user.id !== item.id ? (
                                        <ConfirmationDialog>
                                            {({ showConfirmation }) => (
                                                <DeleteIcon
                                                    onClick={() =>
                                                        showConfirmation(() => actions.delete(item))
                                                    }
                                                />
                                            )}
                                        </ConfirmationDialog>
                                    ) : (
                                        <Tooltip
                                            placement={"bottom"}
                                            content={
                                                <span>{t`You can't delete your own user account.`}</span>
                                            }
                                        >
                                            <DeleteIcon disabled />
                                        </Tooltip>
                                    )}
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default UsersDataList;
