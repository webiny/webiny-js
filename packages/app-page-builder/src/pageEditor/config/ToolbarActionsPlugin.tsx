import React, { useCallback, useState } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";

import { createDecorator } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { IconButton, ButtonPrimary } from "@webiny/ui/Button";
import { Dialog, DialogCancel, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";
import { ReactComponent as LockIcon } from "@material-design-icons/svg/outlined/lock.svg";
import { ToolbarActions } from "~/editor";
import { renderPlugin } from "~/editor/components/Editor/Toolbar";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";
import { rootElementAtom, elementByIdSelector } from "~/editor/recoil/modules";
import { PbEditorElement, PbEditorToolbarBottomPlugin, PbEditorToolbarTopPlugin } from "~/types";
import { useMutation } from "@apollo/react-hooks";
import { usePage } from "~/pageEditor";
import { UNLINK_PAGE_FROM_TEMPLATE } from "~/pageEditor/graphql";

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

export const ToolbarActionsPlugin = createDecorator(ToolbarActions, ToolbarActionsWrapper => {
    return function BlockEditorToolbarActions() {
        const actionsTop = plugins.byType<PbEditorToolbarTopPlugin>("pb-editor-toolbar-top");
        const actionsBottom = plugins.byType<PbEditorToolbarBottomPlugin>(
            "pb-editor-toolbar-bottom"
        );
        const [isTemplateMode] = useTemplateMode();
        const [isModalShown, setIsModalShown] = useState(false);
        const rootElementId = useRecoilValue(rootElementAtom);
        const rootElement = useRecoilValue(elementByIdSelector(rootElementId)) as PbEditorElement;
        const [unlinkPage, unlinkPageMutation] = useMutation(UNLINK_PAGE_FROM_TEMPLATE);

        const [page] = usePage();

        // TODO: check if the below check even works.
        const unlinkPermission = true;
        // const unlinkPermission = useMemo((): boolean => {
        //     const permission = getPermission<PageBuilderSecurityPermission>("pb.template.unlink");
        //     if (permission?.name === "*" || permission?.name === "pb.*") {
        //         return true;
        //     }
        //     return Boolean(permission);
        // }, [identity]);

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
        }, [rootElement]);

        return (
            <>
                <ToolbarActionsWrapper>
                    {isTemplateMode ? (
                        <IconButton icon={<LockIcon />} onClick={onOpen} />
                    ) : (
                        <div>{actionsTop.map(renderPlugin)}</div>
                    )}
                    <div>{actionsBottom.map(renderPlugin)}</div>
                </ToolbarActionsWrapper>
                <Dialog open={isModalShown} onClose={onClose} className={unlinkTemplateDialog}>
                    <DialogTitle>Unlink Template</DialogTitle>
                    <DialogContent>
                        <p>
                            This page was created from a template. To change it, you need to unlink
                            it first.
                        </p>
                        <p>
                            By unlinking it, any changes made to the template will no longer be
                            reflected on this page.
                        </p>
                        {/* TODO: Bring back when there's actually a link to the docs. */}
                        {/*<div className="info-wrapper">*/}
                        {/*    <InfoIcon /> Click here to learn more about how page templates work*/}
                        {/*</div>*/}
                    </DialogContent>
                    <DialogActions>
                        <DialogCancel onClick={onClose}>Cancel</DialogCancel>
                        <ButtonPrimary
                            disabled={!unlinkPermission || unlinkPageMutation.loading}
                            onClick={onUnlink}
                        >
                            {unlinkPermission ? "Unlink template" : "No permissions"}
                        </ButtonPrimary>
                    </DialogActions>
                </Dialog>
            </>
        );
    };
});
