import React from "react";
import { i18n } from "@webiny/app/i18n";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { Typography } from "@webiny/ui/Typography";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";
import { Link } from "@webiny/react-router";
import {ConfirmationDialogWithInput} from "./ConfirmationDialogWithInput";

const t = i18n.ns("app-headless-cms/admin/environments/data-list");

const EnvironmentsDataList = () => {
    const { actions, list } = useCrud();

    const {
        environments: { refreshEnvironments, selectAvailableEnvironment, isSelectedEnvironment }
    } = useCms();

    return (
        <DataList
            {...list}
            title={t`Environments`}
            sorters={[
                {
                    label: t`Newest to oldest`,
                    sorters: { createdOn: -1 }
                },
                {
                    label: t`Oldest to newest`,
                    sorters: { createdOn: 1 }
                },
                {
                    label: t`Name A-Z`,
                    sorters: { name: 1 }
                },
                {
                    label: t`Name Z-A`,
                    sorters: { name: -1 }
                }
            ]}
        >
            {({ data, isSelected, select }) => {
                return (
                    <List data-testid="default-data-list">
                        {data.map(item => (
                            <ListItem key={item.id} selected={isSelected(item)}>
                                <ListItemText onClick={() => select(item)}>
                                    {item.name}{" "}
                                    {item.default && (
                                        <Typography use={"overline"}>{t`(default)`}</Typography>
                                    )}
                                    <ListItemTextSecondary>
                                        {item.environmentAlias
                                            ? t`Assigned to: {environmentAlias}`({
                                                environmentAlias: (
                                                    <Link
                                                        onClick={e => e.stopPropagation()}
                                                        to={`/settings/cms/environments/aliases?id=${item.environmentAlias.id}`}
                                                        title={t`This environment is linked with the "{environmentAlias}" alias.`(
                                                            {
                                                                environmentAlias:
                                                                item.environmentAlias.name
                                                            }
                                                        )}
                                                    >
                                                        {item.environmentAlias.name}
                                                    </Link>
                                                )
                                            })
                                            : t`Not linked with an alias.`}
                                    </ListItemTextSecondary>
                                </ListItemText>

                                <ListItemMeta>
                                    <ListActions>
                                        <ConfirmationDialogWithInput
                                            title={"Remove environment"}
                                            message={t`This action {verb} be undone. This will permanently delete the {name} environment and all of the created content.`({ name: <b>{item.name}</b>, verb: <b>cannot</b>  })}
                                            resourceName={item.name}
                                        >
                                            {({ showConfirmation }) => (
                                                <DeleteIcon
                                                    onClick={() => {
                                                        showConfirmation(async () => {
                                                            // If we deleted the environment that was currently selected,
                                                            // let's automatically switch to the first available one.
                                                            await actions.delete(item);

                                                            if (isSelectedEnvironment(item)) {
                                                                selectAvailableEnvironment([item]);
                                                            }

                                                            refreshEnvironments();
                                                        });
                                                    }}
                                                />
                                            )}
                                        </ConfirmationDialogWithInput>
                                    </ListActions>
                                </ListItemMeta>
                            </ListItem>
                        ))}
                    </List>
                )
            }}
        </DataList>
    );
};

export default EnvironmentsDataList;
