// @flow
import * as React from "react";
import {
    withDataList,
    withRouter,
    type WithRouterProps,
    type WithDataListProps
} from "webiny-app/components";
import { i18n } from "webiny-app/i18n";
import { compose } from "recompose";
import { withSnackbar, type WithSnackbarProps } from "webiny-app-admin/components";
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
import { ExportIcon, ImportIcon } from "./PoliciesDataList/icons";

const t = i18n.namespace("Security.PoliciesDataList");

const PoliciesDataList = (
    props: WithRouterProps & WithSnackbarProps & { PoliciesDataList: WithDataListProps }
) => {
    const { PoliciesDataList, router } = props;

    return (
        <DataList
            {...PoliciesDataList}
            actions={
                <React.Fragment>
                    <Tooltip content={t`Import policies.`}>
                        <ImportIcon onClick={() => console.log("Import policies!")} />
                    </Tooltip>
                </React.Fragment>
            }
            multiSelectActions={
                <React.Fragment>
                    <Tooltip content={t`Export selected policies.`}>
                        <ExportIcon
                            onClick={() => {
                                console.log(
                                    "multi selected items: ",
                                    PoliciesDataList.getMultiSelected()
                                );
                            }}
                        />
                    </Tooltip>
                </React.Fragment>
            }
            title={t`Security Policies`}
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
                                                onClick={() => {
                                                    showConfirmation(() => {
                                                        PoliciesDataList.delete(item.id, {
                                                            onSuccess: () => {
                                                                PoliciesDataList.refresh();
                                                                props.showSnackbar(
                                                                    t`Policy {name} deleted.`({
                                                                        name: item.name
                                                                    })
                                                                );
                                                                item.id === router.getQuery().id &&
                                                                    router.goToRoute({
                                                                        params: { id: null },
                                                                        merge: true
                                                                    });
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
                </ScrollList>
            )}
        </DataList>
    );
};

export default compose(
    withSnackbar(),
    withRouter(),
    withDataList({
        name: "PoliciesDataList",
        type: "Security.Policies",
        fields: "id name description createdOn",
        sort: { savedOn: -1 }
    })
)(PoliciesDataList);
