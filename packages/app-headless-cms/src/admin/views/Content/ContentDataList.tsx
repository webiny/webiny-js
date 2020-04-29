import React from "react";
import { i18n } from "@webiny/app/i18n";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import CurrentEnvironmentLabel from "./../../components/CurrentEnvironmentLabel";
import TimeAgo from "timeago-react";
import { upperFirst } from "lodash";
import { Typography } from "@webiny/ui/Typography";
import { DeleteIcon, EditIcon } from "@webiny/ui/List/DataList/icons";
import { css } from "emotion";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";
import { I18NValue } from "@webiny/app-i18n/components";

const t = i18n.ns("app-headless-cms/admin/contents/data-list");

const rightAlign = css({
    alignItems: "flex-end !important",
    justifyContent: "center !important"
});

const listItemMinHeight = css({
    minHeight: "66px !important"
});

const ContentDataList = ({ contentModel }) => {
    const { actions, list } = useCrud();

    return (
        <DataList
            {...list}
            title={contentModel.title}
            actions={<CurrentEnvironmentLabel style={{ justifyContent: "flex-end" }} />}
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
            {({ data, isSelected, select }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <ListItem
                            key={item.id}
                            className={listItemMinHeight}
                            selected={isSelected(item)}
                        >
                            <ListItemText onClick={() => select(item)}>
                                <I18NValue value={item.meta.title} />
                                <ListItemTextSecondary>
                                    {item.createdBy &&
                                        (item.createdBy.firstName && (
                                            <>
                                                {t`Created by: {user}.`({
                                                    user: item.createdBy.firstName
                                                })}{" "}
                                            </>
                                        ))}
                                    {t`Last modified: {time}.`({
                                        time: <TimeAgo datetime={item.savedOn} />
                                    })}
                                </ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta className={rightAlign}>
                                <Typography use={"subtitle2"}>
                                    {upperFirst(item.meta.status)} (v{item.meta.version})
                                </Typography>
                                <ListActions>
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() => {
                                                    showConfirmation(() => actions.delete(item));
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

export default ContentDataList;
