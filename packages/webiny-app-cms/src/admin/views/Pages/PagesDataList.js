// @flow
import * as React from "react";
import { compose } from "recompose";
import { withDataList, withRouter } from "webiny-app/components";
import { i18n } from "webiny-app/i18n";
import { withSnackbar } from "webiny-app-admin/components/withSnackbar";
import { DeleteIcon } from "webiny-ui/List/DataList/icons";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "webiny-ui/List";


const t = i18n.namespace("Cms.PagesDataList");

const PagesDataList = props => {
    const { PagesDataList, router, showSnackbar } = props;

    return (
        <DataList
            {...PagesDataList}
            title={t`CMS Pages`}
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
                    label: "Title A-Z",
                    sorters: { title: 1 }
                },
                {
                    label: "Title Z-A",
                    sorters: { title: -1 }
                }
            ]}
        >
            {({ data }) => (
                <List>
                    {data.map(item => (
                        <ListItem key={item.id}>
                            <ListItemText
                                onClick={() =>
                                    router.goToRoute({ params: { id: item.id }, merge: true })
                                }
                            >
                                {item.title}
                                <ListItemTextSecondary>{item.url}</ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() => {
                                                    showConfirmation(() => {
                                                        PagesDataList.delete(item.id, {
                                                            onSuccess: () => {
                                                                PagesDataList.refresh();
                                                                showSnackbar(
                                                                    t`Page {title} deleted.`({
                                                                        name: item.title
                                                                    })
                                                                );
                                                            }
                                                        });
                                                    });
                                                }}
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

export default compose(
    withSnackbar(),
    withRouter(),
    withDataList({
        name: "PagesDataList",
        type: "Cms.Pages",
        fields: "id title slug revisions",
        sort: { savedOn: -1 }
    })
)(PagesDataList);
