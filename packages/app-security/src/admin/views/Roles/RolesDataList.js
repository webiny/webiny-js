// @flow
import * as React from "react";
import useRouter from "use-react-router";
import { i18n } from "@webiny/app/i18n";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { Checkbox } from "@webiny/ui/Checkbox";
import { useCrudList } from "@webiny/app-admin/context/CrudContext";
import { LIST_ROLES, DELETE_ROLE } from "./graphql";
import { get } from "lodash";
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

const t = i18n.namespace("Security.RolesDataList");

const RolesDataList = () => {
    const { location, history } = useRouter();
    const query = new URLSearchParams(location.search);

    const { deleteRecord, ...crudListProps } = useCrudList({
        get: {
            query: LIST_ROLES,
            variables: { sort: { savedOn: -1 } },
            response: data => get(data, "security.roles")
        },
        delete: {
            mutation: DELETE_ROLE,
            response: data => data.security.deleteRole,
            snackbar: data => t`Role {name} deleted.`({ name: data.name })
        }
    });

    return (
        <DataList
            {...crudListProps}
            title={t`Security Roles`}
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
                    sorters: { name: 1 }
                },
                {
                    label: "Name Z-A",
                    sorters: { name: -1 }
                }
            ]}
        >
            {({ data, multiSelect, isMultiSelected }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={query.get("id") === item.id}>
                            <ListItemGraphic>
                                <Checkbox
                                    value={isMultiSelected(item)}
                                    onClick={() => {
                                        multiSelect(item);
                                    }}
                                />
                            </ListItemGraphic>

                            <ListItemText
                                onClick={() => {
                                    query.set("id", item.id);
                                    history.push({ search: query.toString() });
                                }}
                            >
                                {item.name}
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() =>
                                                    showConfirmation(() => deleteRecord(item))
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
