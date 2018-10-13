// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta
} from "webiny-ui/List";
import { DeleteIcon } from "webiny-ui/List/DataList/icons";

const t = i18n.namespace("Security.ApiTokensDataList");

const ApiTokensDataList = ({ deleteApiToken, dataList, data, meta, router }: Object) => {
    return (
        <DataList
            {...dataList}
            data={data}
            meta={meta}
            title={t`API Tokens`}
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
            {({ data }) => (
                <List>
                    {data.map(item => (
                        <ListItem key={item.id} selected={router.getQuery("id") === item.id}>
                            <ListItemText
                                onClick={() => {
                                    router.goToRoute({
                                        merge: true,
                                        params: { id: item.id }
                                    });
                                }}
                            >
                                {item.name}
                                <ListItemTextSecondary>{item.description}</ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <ConfirmationDialog>
                                    {({ showConfirmation }) => (
                                        <DeleteIcon
                                            onClick={() =>
                                                showConfirmation(() => deleteApiToken(item))
                                            }
                                        />
                                    )}
                                </ConfirmationDialog>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </List>
            )}
        </DataList>
    );
};

export default ApiTokensDataList;
