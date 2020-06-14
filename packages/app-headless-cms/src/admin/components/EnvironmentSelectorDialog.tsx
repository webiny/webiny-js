import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { useRouter } from "@webiny/react-router";
import { ReactComponent as DoneIcon } from "@webiny/app-headless-cms/admin/icons/done-24px.svg";
import { ReactComponent as ForwardIcon } from "@webiny/app-headless-cms/admin/icons/arrow_forward-24px.svg";

import {
    List,
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary,
    ListItemGraphic
} from "@webiny/ui/List";

export type NewContentModelDialogProps = {
    open: boolean;
    onClose: () => void;
    onSelectViewAll?: (args: { onClose: () => void; redirect: () => void }) => void;
    onSelectEnvironment?: (args: { onClose: () => void }) => void;
};

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

const NewContentModelDialog: React.FC<NewContentModelDialogProps> = ({
    open,
    onClose,
    onSelectViewAll,
    onSelectEnvironment
}) => {
    const {
        environments: { currentEnvironment, environments, selectEnvironment }
    } = useCms();

    const { history } = useRouter();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="environment-selector-modal"
        >
            <DialogTitle>{t`Change environment`}</DialogTitle>
            <DialogContent>
                <div className={listWrapper}>
                    <List twoLine>
                        {environments.map(item => {
                            const selected =
                                currentEnvironment && item.id === currentEnvironment.id;
                            return (
                                <ListItem
                                    key={item.id}
                                    onClick={() => {
                                        if (selected) {
                                            return;
                                        }

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
                                    <ListItemGraphic>
                                        {selected && (
                                            <DoneIcon
                                                style={{ color: "var(--mdc-theme-primary)" }}
                                            />
                                        )}
                                    </ListItemGraphic>
                                    <ListItemText>
                                        <ListItemTextPrimary>{item.name}</ListItemTextPrimary>
                                        <ListItemTextSecondary>
                                            Alias:{" "}
                                            {item.environmentAlias
                                                ? item.environmentAlias.name
                                                : t`None`}
                                        </ListItemTextSecondary>
                                    </ListItemText>
                                </ListItem>
                            );
                        })}
                    </List>
                </div>

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
                                // Give the dialog a chance to close properly.
                                setTimeout(() => history.push("/settings/cms/environments"), 250);
                            }
                        }}
                    >
                        <ButtonIcon icon={<ForwardIcon />} />
                        {t`Manage environments`}
                    </ButtonDefault>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewContentModelDialog;
