import React, {useState} from "react";
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
const t = i18n.ns("app-headless-cms/admin/components/editor/tabs/indexes");

const formPreviewWrapper = css({
    padding: 40,
    backgroundColor: "var(--webiny-theme-color-surface, #fff) !important",
    margin: 40,
    boxSizing: "border-box"
});

const listWrapper = css({
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",
    ".mdc-list .mdc-list-item": {
        borderBottom: "1px solid var(--mdc-theme-on-background)"
    },
    ".mdc-list .mdc-list-item:last-child": {
        borderBottom: "none"
    }
});

const centeredBottomButton = css({
    textAlign: "center",
    width: "100%"
});

export const IndexesTab = () => {
    const { data } = useContentModelEditor();
    const [dialogOpen, setDialogOpen] = useState(false);

    const indexes = [
        { id: 1, fields: ["title"], status: "active" },
        { id: 2, fields: ["price"], status: "active" },
        { id: 3, fields: ["title", "price"], status: "pending" }
    ];
    return (
        <Elevation z={1} className={formPreviewWrapper}>
            <div className={listWrapper}>
                <div className={centeredBottomButton}>
                    <ButtonDefault
                        onClick={() => setDialogOpen(true)}
                    >
                        <ButtonIcon icon={<AddIcon />} />
                        {t`Create index`}
                    </ButtonDefault>
                    <NewIndexDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

                </div>
                <List twoLine>
                    {indexes.map(item => (
                        <ListItem key={item.id}>
                            <ListItemText>
                                <ListItemTextPrimary>{item.fields.join(", ")}</ListItemTextPrimary>
                                <ListItemTextSecondary>Status: {item.status}</ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <ListActions>
                                    <ConfirmationDialog>
                                        {({ showConfirmation }) => (
                                            <DeleteIcon
                                                onClick={() => {
                                                    showConfirmation(() => console.log(12));
                                                }}
                                            />
                                        )}
                                    </ConfirmationDialog>
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </List>
            </div>
        </Elevation>
    );
};
