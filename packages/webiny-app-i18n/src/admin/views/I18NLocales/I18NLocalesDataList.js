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
    ListItemMeta,
    ListActions
} from "webiny-ui/List";

import { DeleteIcon } from "webiny-ui/List/DataList/icons";
import CountryFlag from "./components/CountryFlag";

const t = i18n.namespace("I18N.I18NLocalesDataList");

const I18NLocalesDataList = ({
    dataList,
    location,
    history,
    deleteRecord
}: WithCrudListProps & { location: Location, history: RouterHistory }) => {
    const query = new URLSearchParams(location.search);

    return (
        <DataList
            {...dataList}
            title={t`Locales`}
            sorters={[
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
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={query.get("id") === item.id}>
                            <ListItemText
                                onClick={() => {
                                    query.set("id", item.id);
                                    history.push({ search: query.toString() });
                                }}
                            >
                                <CountryFlag locale={item} />
                                {item.code}
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

export default withRouter(I18NLocalesDataList);
