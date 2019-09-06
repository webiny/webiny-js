// @flow
import * as React from "react";
import useRouter from "use-react-router";
import { i18n } from "@webiny/app/i18n";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";

const t = i18n.namespace("app-security/admin/roles/data-list");

const RolesDataList = () => {
    const { location, history } = useRouter();
    const query = new URLSearchParams(location.search);

    const { actions, list } = useCrud();

    return (
        <DataList
            {...list}
            title={t`Security Roles`}
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
                    sorters: { name: 1 }
                },
                {
                    label: t`Name Z-A`,
                    sorters: { name: -1 }
                }
            ]}
        >
            {({ data, isSelected, select }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={isSelected(item)}>
                            <ListItemText onClick={() => select(item)}>
                                {item.name}
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() =>
                                                    showConfirmation(() => actions.delete(item))
                                                }
                                            />
                                        )}
                                    </ConfirmationDialog>
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default RolesDataList;
