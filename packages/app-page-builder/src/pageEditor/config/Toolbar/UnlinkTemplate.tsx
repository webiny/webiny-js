import React, { useCallback, useState } from "react";
import { css } from "emotion";
import { useMutation } from "@apollo/react-hooks";
import { IconButton, ButtonPrimary } from "@webiny/ui/Button";
import { Dialog, DialogCancel, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";
import { ReactComponent as LockIcon } from "@material-design-icons/svg/outlined/lock.svg";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";
import { usePage } from "~/pageEditor/hooks/usePage";
import { UNLINK_PAGE_FROM_TEMPLATE } from "~/pageEditor/graphql";
import { PageEditorConfig } from "~/pageEditor/editorConfig/PageEditorConfig";

const unlinkTemplateDialog = css`
    & .mdc-dialog__surface {
        width: 500px;
    }

    & .webiny-ui-dialog__title {
        text-transform: uppercase;
    }

    & p {
        margin-bottom: 16px;
    }

    & .info-wrapper {
        display: flex;
        align-items: center;
        font-size: 12px;

        & svg {
            width: 18px;
            margin-right: 5px;
        }
    }
`;

const UnlinkTemplateAction = () => {
    const [isModalShown, setIsModalShown] = useState(false);
    const [unlinkPage, unlinkPageMutation] = useMutation(UNLINK_PAGE_FROM_TEMPLATE);

    const [page] = usePage();

    const onOpen = useCallback(() => {
        setIsModalShown(true);
    }, []);

    const onClose = useCallback(() => {
        setIsModalShown(false);
    }, []);

    const onUnlink = useCallback(() => {
        unlinkPage({
            variables: { id: page.id }
        }).then(() => {
            // TODO: We do a screen refresh just because of some weird state inconsistency-related
            // TODO: issue. Should fix this when there's more time at hand.
            window.location.reload();
        });
    }, [page.id]);

    return (
        <>
            <IconButton icon={<LockIcon />} onClick={onOpen} />
            <Dialog open={isModalShown} onClose={onClose} className={unlinkTemplateDialog}>
                <DialogTitle>Unlink Template</DialogTitle>
                <DialogContent>
                    <p>
                        This page was created from a template. To change it, you need to unlink it
                        first.
                    </p>
                    <p>
                        By unlinking it, any changes made to the template will no longer be
                        reflected on this page.
                    </p>
                </DialogContent>
                <DialogActions>
                    <DialogCancel onClick={onClose}>Cancel</DialogCancel>
                    <ButtonPrimary disabled={unlinkPageMutation.loading} onClick={onUnlink}>
                        Unlink template
                    </ButtonPrimary>
                </DialogActions>
            </Dialog>
        </>
    );
};

export const UnlinkTemplate = PageEditorConfig.Ui.Toolbar.Elements.createDecorator(Original => {
    return function UnlinkTemplate(props) {
        const [isTemplateMode] = useTemplateMode();

        if (props.group === "top" && isTemplateMode) {
            return <UnlinkTemplateAction />;
        }

        return <Original {...props} />;
    };
});
