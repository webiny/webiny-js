import React from "react";
import { withRouter } from "react-router-dom";
import { i18n } from "webiny-app/i18n";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { DeleteIcon } from "webiny-ui/List/DataList/icons";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "webiny-ui/List";

const t = i18n.namespace("Pb.CategoriesDataList");

const CategoriesDataList = ({ dataList, history, location, deleteRecord }) => {
    return (
        <DataList
            {...dataList}
            title={t`Categories`}
            sorters={[
                {
                    label: "Newest to oldest",
                    sorters: { createdOn: -1 }
                },
                {
                    label: "Oldest to newest",
                    sorters: { createdOn: 1 }
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
            {({ data }) => (
                <List>
                    {data.map(item => (
                        <ListItem key={item.id}>
                            <ListItemText
                                onClick={() => {
                                    const query = new URLSearchParams(location.search);
                                    query.set("id", item.id);
                                    history.push({ search: query.toString() });
                                }}
                            >
                                {item.name}
                                <ListItemTextSecondary>{item.url}</ListItemTextSecondary>
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
                </List>
            )}
        </DataList>
    );
};

export default withRouter(CategoriesDataList);
