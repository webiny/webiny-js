import React from "react";
import { i18n } from "@webiny/app/i18n";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";

const t = i18n.ns("app-graphql-app-target/data-list");

const TargetsDataList = () => {
    const { actions, list } = useCrud();
    return (
        <DataList
            {...list}
            title={t`Targets`}
            sorters={[
                {
                    label: t`Newest to oldest`,
                    sorters: "createdOn_DESC"
                },
                {
                    label: t`Oldest to newest`,
                    sorters: "createdOn_ASC"
                },
                {
                    label: t`Name A-Z`,
                    sorters: "title_ASC"
                },
                {
                    label: t`Name Z-A`,
                    sorters: "title_DESC"
                }
            ]}
        >
            {({ data, select, isSelected }) => (
                <ScrollList data-testid="default-data-list">
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

export default TargetsDataList;
