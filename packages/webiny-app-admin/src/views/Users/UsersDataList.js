// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { withSecurity, type WithSecurityProps } from "webiny-app-admin/components";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { Tooltip } from "webiny-ui/Tooltip";
import type { WithCrudListProps } from "webiny-app-admin/components";

import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions,
    ListItemGraphic
} from "webiny-ui/List";

import { DeleteIcon } from "webiny-ui/List/DataList/icons";
import { Avatar } from "webiny-ui/Avatar";

const t = i18n.namespace("Security.UsersDataList");

type Props = WithCrudListProps & WithSecurityProps;

const UsersDataList = ({ dataList, router, security, deleteRecord }: Props) => {
    return (
        <DataList
            {...dataList}
            title={t`Security Users`}
            sorters={[
                {
                    label: "Newest to oldest",
                    sorters: { savedOn: -1 }
                },
                {
                    label: "Oldest to newest",
                    sorters: { savedOn: 1 }
                },
                {
                    label: "Name A-Z",
                    sorters: { lastName: 1 }
                },
                {
                    label: "Name Z-A",
                    sorters: { lastName: -1 }
                }
            ]}
        >
            {({ data }) => (
                <ScrollList twoLine avatarList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={router.getQuery("id") === item.id}>
                            <ListItemGraphic>
                                <Avatar
                                    src={item.avatar && item.avatar.src}
                                    fallbackText={item.fullName}
                                    alt={t`User's avatar.`}
                                />
                            </ListItemGraphic>
                            <ListItemText
                                onClick={() =>
                                    router.goToRoute({ params: { id: item.id }, merge: true })
                                }
                            >
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
                                                        showConfirmation(() => deleteRecord(item))
                                                    }
                                                />
                                            )}
                                        </ConfirmationDialog>
                                    ) : (
                                        <Tooltip
                                            placement={"bottom"}
                                            content={
                                                <span
                                                >{t`You can't delete your own user account.`}</span>
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

export default withSecurity()(UsersDataList);
