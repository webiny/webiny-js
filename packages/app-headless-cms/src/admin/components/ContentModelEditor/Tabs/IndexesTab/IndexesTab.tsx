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
import TimeAgo from "timeago-react";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsEditorContentTab } from "@webiny/app-headless-cms/types";

const t = i18n.ns("app-headless-cms/admin/components/editor/tabs/indexes");

const style = {
    previewWrapper: css({
        padding: 40,
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

export const IndexesTab: CmsEditorContentTab = () => {
    const { data, setData } = useContentModelEditor();
    const [dialogOpen, setDialogOpen] = useState(false);
    const { showSnackbar } = useSnackbar();

    const { indexes, fields } = data;

    const isDefaultIdIndex = useCallback(index => {
        return index.fields.length === 1 && index.fields[0] === "id";
    }, []);

    return (
        <Elevation z={1} className={style.previewWrapper}>
            {fields && fields.length ? (
                <div className={style.listWrapper}>
                    <React.Fragment>
                        <div className={style.addIndexButton}>
                            <ButtonDefault onClick={() => setDialogOpen(true)}>
                                <ButtonIcon icon={<AddIcon />} />
                                {t`Add index`}
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
                                                    <ConfirmationDialog
                                                        title={t`Confirm index removal`}
                                                        message={t`You are about to remove the {index} index. Are you sure you want to continue?`(
                                                            {
                                                                index: (
                                                                    <strong>
                                                                        {item.fields.join(", ")}
                                                                    </strong>
                                                                )
                                                            }
                                                        )}
                                                    >
                                                        {({ showConfirmation }) => (
                                                            <DeleteIcon
                                                                onClick={() => {
                                                                    showConfirmation(() => {
                                                                        setData(data => {
                                                                            const itemHash = item.fields
                                                                                .sort()
                                                                                .join();
                                                                            const index = data.indexes.findIndex(
                                                                                current => {
                                                                                    const currentHash = current.fields
                                                                                        .sort()
                                                                                        .join();
                                                                                    return (
                                                                                        itemHash ===
                                                                                        currentHash
                                                                                    );
                                                                                }
                                                                            );

                                                                            data.indexes.splice(
                                                                                index,
                                                                                1
                                                                            );
                                                                            return data;
                                                                        });

                                                                        showSnackbar(
                                                                            t`Index removed. To apply the changes, please save the content model.`
                                                                        );
                                                                    });
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
                </div>
            ) : (
                <div className={style.noFieldsMessage}>
                    {t`Before creating an index, please add at least one field to the content model.`}
                </div>
            )}
        </Elevation>
    );
};
