import React from "react";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";
import { i18n } from "@webiny/app/i18n";
import { withSecurity } from "@webiny/app-security/admin/context";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Image } from "@webiny/app/components";

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

const t = i18n.namespace("Security.UsersDataList");

const UsersDataList = ({ dataList, location, history, security, deleteRecord }) => {
    const query = new URLSearchParams(location.search);

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
                        <ListItem key={item.id} selected={query.get("id") === item.id}>
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
                            <ListItemText
                                onClick={() => {
                                    query.set("id", item.id);
                                    history.push({ search: query.toString() });
                                }}
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

export default compose(
    withSecurity(),
    withRouter
)(UsersDataList);
