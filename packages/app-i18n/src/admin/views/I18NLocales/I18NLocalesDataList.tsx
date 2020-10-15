import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "react-apollo";
import { LIST_LOCALES, DELETE_LOCALE } from "./graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";

import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";

const t = i18n.ns("app-i18n/admin/locales/data-list");

const I18NLocalesDataList = () => {
    const { refetchLocales } = useI18N();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const listQuery = useQuery(LIST_LOCALES);
    const [deleteIt, deleteMutation] = useMutation(DELETE_LOCALE, {
        refetchQueries: [{ query: LIST_LOCALES }]
    });

    const { showConfirmation } = useConfirmationDialog();

    const data = listQuery?.data?.i18n?.listI18NLocales?.data || [];

    const deleteItem = useCallback(item => {
        showConfirmation(async () => {
            const response = await deleteIt({
                variables: item
            });

            const error = response?.data?.i18n?.deleteI18NLocale?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            showSnackbar(t`Locale "{code}" deleted.`({ code: item.code }));

            const code = new URLSearchParams(location.search).get("code");
            if (code === item.code) {
                history.push(`/i18n/locales`);
            }

            refetchLocales();
        });
    }, []);

    const loading = [listQuery, deleteMutation].find(item => item.loading);

    return (
        <DataList
            loading={Boolean(loading)}
            data={data}
            title={t`Locales`}
            refresh={listQuery.refetch}
        >
            {({ data }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.code}>
                            <ListItemText
                                onClick={() => history.push(`/i18n/locales?code=${item.code}`)}
                            >
                                <ListItemTextPrimary>{item.code}</ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    {item.default && t`Default locale`}
                                </ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon onClick={() => deleteItem(item)} />
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
