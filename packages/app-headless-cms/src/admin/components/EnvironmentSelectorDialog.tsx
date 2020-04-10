import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { ButtonDefault } from "@webiny/ui/Button";
import useReactRouter from "use-react-router";
import {
    List,
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary,
    ListItemMeta,
    ListActions
} from "@webiny/ui/List";

const t = i18n.ns("app-headless-cms/admin/components/environment-selector-dialog");

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

const centeredBottomButton = css({
    textAlign: "center",
    width: "100%"
});

export type NewContentModelDialogProps = {
    open: boolean;
    onClose: () => void;
    onSelectViewAll?: (args: { onClose: () => void; redirect: () => void }) => void;
    onSelectEnvironment?: (args: { onClose: () => void }) => void;
};

const NewContentModelDialog: React.FC<NewContentModelDialogProps> = ({
    open,
    onClose,
    onSelectViewAll,
    onSelectEnvironment
}) => {
    const {
        environments: { currentEnvironment, environments, selectEnvironment }
    } = useCms();

    const { history } = useReactRouter();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="environment-selector-modal"
        >
            <DialogTitle>{t`Change environment`}</DialogTitle>
            <DialogContent>
                <List twoLine>
                    {environments.map(item => (
                        <ListItem
                            key={item.id}
                            onClick={() => {
                                if (typeof onSelectEnvironment === "function") {
                                    onSelectEnvironment({
                                        onClose
                                    });
                                } else {
                                    selectEnvironment(item);
                                    onClose();
                                }
                            }}
                        >
                            <ListItemText>
                                <ListItemTextPrimary>{item.name}</ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    Alias:{" "}
                                    {item.environmentAlias ? item.environmentAlias.name : t`None`}
                                </ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <ListActions>
                                    {currentEnvironment &&
                                        item.id === currentEnvironment.id &&
                                        t`(Currently selected)`}
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </List>

                <div className={centeredBottomButton}>
                    <ButtonDefault
                        onClick={() => {
                            if (typeof onSelectViewAll === "function") {
                                onSelectViewAll({
                                    onClose,
                                    redirect: () => history.push("/settings/cms/environments")
                                });
                            } else {
                                onClose();
                                // Give the dialog chance to close properly.
                                setTimeout(() => history.push("/settings/cms/environments"), 250);
                            }
                        }}
                    >{t`Manage environments`}</ButtonDefault>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewContentModelDialog;
