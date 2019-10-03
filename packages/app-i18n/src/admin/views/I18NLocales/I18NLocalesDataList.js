// @flow
import * as React from "react";
import { i18n } from "@webiny/app/i18n";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";

const t = i18n.ns("app-i18n/admin/locales/data-list");

const I18NLocalesDataList = () => {
    const { actions, list } = useCrud();
    const { refetchLocales } = useI18N();

    return (
        <DataList
            {...list}
            title={t`Locales`}
            sorters={[
                {
                    label: t`Language A-Z`,
                    sorters: { code: 1 }
                },
                {
                    label: t`Language Z-A`,
                    sorters: { code: -1 }
                }
            ]}
        >
            {({ data, isSelected, select }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={isSelected(item)}>
                            <ListItemText onClick={() => select(item)}>{item.code}</ListItemText>
                            <ListItemMeta>
                                <ListActions>
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() =>
                                                    showConfirmation(async () => {
                                                        await actions.delete(item);
                                                        refetchLocales();
                                                    })
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

export default I18NLocalesDataList;
