import React, { useCallback, useState } from "react";
import { css } from "emotion";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { Elevation } from "@webiny/ui/Elevation";
import {
    List,
    ListActions,
    ListItem,
    ListItemMeta,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/round-add-24px.svg";
import NewIndexDialog from "./NewIndexDialog";
import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";
import TimeAgo from "timeago-react";
import { Tooltip } from "@webiny/ui/Tooltip";

const t = i18n.ns("app-headless-cms/admin/components/editor/tabs/indexes");

const style = {
    previewWrapper: css({
        padding: 40,
        backgroundColor: "var(--webiny-theme-color-surface, #fff) !important",
        margin: 40,
        boxSizing: "border-box"
    }),
    listWrapper: css({
        marginBottom: 10,
        display: "flex",
        flexDirection: "column",
        ".mdc-list .mdc-list-item": {
            borderBottom: "1px solid var(--mdc-theme-on-background)"
        },
        ".mdc-list .mdc-list-item:last-child": {
            borderBottom: "none"
        }
    }),
    addIndexButton: css({
        textAlign: "center",
        width: "100%"
    }),
    noFieldsMessage: css({
        textAlign: "center"
    })
};

export const IndexesTab = () => {
    const { data } = useContentModelEditor();
    const [dialogOpen, setDialogOpen] = useState(false);

    const { indexes, fields } = data;

    const isDefaultIdIndex = useCallback(index => {
        return index.fields.length === 1 && index.fields[0] === "id";
    }, []);

    return (
        <Elevation z={1} className={style.previewWrapper}>
            <div className={style.listWrapper}>
                {fields && fields.length ? (
                    <React.Fragment>
                        <div className={style.addIndexButton}>
                            <ButtonDefault onClick={() => setDialogOpen(true)}>
                                <ButtonIcon icon={<AddIcon />} />
                                {t`Create index`}
                            </ButtonDefault>
                            <NewIndexDialog
                                open={dialogOpen}
                                onClose={() => setDialogOpen(false)}
                            />
                        </div>
                        <List twoLine>
                            {indexes.map(item => {
                                const fieldsList = item.fields.join(", ");
                                return (
                                    <ListItem key={fieldsList}>
                                        <ListItemText>
                                            <ListItemTextPrimary>{fieldsList}</ListItemTextPrimary>
                                            <ListItemTextSecondary>
                                                {item.createdOn
                                                    ? t`Created: {time}`({
                                                          time: (
                                                              <TimeAgo datetime={item.createdOn} />
                                                          )
                                                      })
                                                    : t`N/A`}
                                            </ListItemTextSecondary>
                                        </ListItemText>
                                        <ListItemMeta>
                                            <ListActions>
                                                {isDefaultIdIndex(item) ? (
                                                    <Tooltip
                                                        placement={"bottom"}
                                                        content={
                                                            <span>{t`The index for the "id" field cannot be deleted.`}</span>
                                                        }
                                                    >
                                                        <DeleteIcon disabled />
                                                    </Tooltip>
                                                ) : (
                                                    <ConfirmationDialog>
                                                        {({ showConfirmation }) => (
                                                            <DeleteIcon
                                                                onClick={() => {
                                                                    showConfirmation(() =>
                                                                        console.log(12)
                                                                    );
                                                                }}
                                                            />
                                                        )}
                                                    </ConfirmationDialog>
                                                )}
                                            </ListActions>
                                        </ListItemMeta>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </React.Fragment>
                ) : (
                    <div className={style.noFieldsMessage}>
                        {t`Before creating an index, please add at least one field to the content model.`}
                    </div>
                )}
            </div>
        </Elevation>
    );
};
