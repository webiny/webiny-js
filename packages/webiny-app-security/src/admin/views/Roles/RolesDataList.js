// @flow
import * as React from "react";
import { withRouter } from "react-router-dom";
import type { Location, RouterHistory } from "react-router-dom";
import type { WithCrudListProps } from "webiny-admin/components";
import { i18n } from "webiny-app/i18n";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
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
import { Checkbox } from "webiny-ui/Checkbox";

const t = i18n.namespace("Security.RolesDataList");

const RolesDataList = ({
    dataList,
    location,
    history,
    deleteRecord
}: WithCrudListProps & { location: Location, history: RouterHistory }) => {
    const query = new URLSearchParams(location.search);

    return (
        <DataList
            {...dataList}
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

export default withRouter(RolesDataList);
