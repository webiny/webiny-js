// @flow
import * as React from "react";
import { get } from "dot-prop-immutable";
import { i18n } from "webiny-app/i18n";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { Tooltip } from "webiny-ui/Tooltip";
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
import { ExportIcon, ImportIcon } from "./RolesDataList/icons";

const t = i18n.namespace("Security.RolesDataList");

const RolesDataList = (props: Object) => {
    const { dataListProps, router, deleteRole } = props;
    const { data, meta } = get(dataListProps, "data.security.roles") || { data: [], meta: {} };

    return (
        <DataList
            {...dataListProps}
            data={data}
            meta={meta}
            actions={
                <React.Fragment>
                    <Tooltip content={t`Import Roles.`}>
                        <ImportIcon onClick={() => console.log("Import Roles!")} />
                    </Tooltip>
                </React.Fragment>
            }
            multiSelectActions={
                <React.Fragment>
                    <Tooltip content={t`Export selected Roles.`}>
                        <ExportIcon
                            onClick={() => {
                                console.log(
                                    "multi selected items: ",
                                    dataListProps.getMultiSelected()
                                );
                            }}
                        />
                    </Tooltip>
                </React.Fragment>
            }
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
                        <ListItem key={item.id} selected={router.getQuery("id") === item.id}>
                            <ListItemGraphic>
                                <Checkbox
                                    value={isMultiSelected(item)}
                                    onClick={() => {
                                        multiSelect(item);
                                    }}
                                />
                            </ListItemGraphic>

                            <ListItemText
                                onClick={() =>
                                    router.goToRoute({ params: { id: item.id }, merge: true })
                                }
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
                                                    showConfirmation(() => deleteRole(item))
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
