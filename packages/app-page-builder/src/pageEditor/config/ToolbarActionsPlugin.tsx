import React, { useCallback, useMemo, useState } from "react";
import { css } from "emotion";
import { useRecoilState, useRecoilValue } from "recoil";

import { createComponentPlugin } from "@webiny/app-admin";
import { useSecurity } from "@webiny/app-security";
import { plugins } from "@webiny/plugins";
import { IconButton, ButtonPrimary } from "@webiny/ui/Button";
import { Dialog, DialogCancel, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";
import { ReactComponent as LockIcon } from "@material-design-icons/svg/outlined/lock.svg";
import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";

import { ToolbarActions } from "~/editor";
import { renderPlugin } from "~/editor/components/Editor/Toolbar";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { templateModeAtom } from "~/pageEditor/state";
import { rootElementAtom, elementByIdSelector } from "~/editor/recoil/modules";
import {
    PbEditorElement,
    PbEditorToolbarBottomPlugin,
    PbEditorToolbarTopPlugin,
    PageBuilderSecurityPermission
} from "~/types";

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

export const ToolbarActionsPlugin = createComponentPlugin(ToolbarActions, ToolbarActionsWrapper => {
    return function BlockEditorToolbarActions() {
        const actionsTop = plugins.byType<PbEditorToolbarTopPlugin>("pb-editor-toolbar-top");
        const actionsBottom = plugins.byType<PbEditorToolbarBottomPlugin>(
            "pb-editor-toolbar-bottom"
        );
        const [isTemplateMode] = useTemplateMode();
        const [isModalShown, setIsModalShown] = useState(false);
        const rootElementId = useRecoilValue(rootElementAtom);
        const rootElement = useRecoilValue(elementByIdSelector(rootElementId)) as PbEditorElement;
        const updateElement = useUpdateElement();
        const [, setIsTemplateMode] = useRecoilState(templateModeAtom);
        const { identity, getPermission } = useSecurity();

        const unlinkPermission = useMemo((): boolean => {
            const permission = getPermission<PageBuilderSecurityPermission>("pb.template.unlink");
            if (permission?.name === "*" || permission?.name === "pb.*") {
                return true;
            }
            return Boolean(permission);
        }, [identity]);

        const onOpen = useCallback(() => {
            setIsModalShown(true);
        }, []);

        const onClose = useCallback(() => {
            setIsModalShown(false);
        }, []);

        const onUnlink = useCallback(() => {
            // we need to drop the `template` property when unlinking.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { template, ...newPageData } = rootElement.data;

            setIsTemplateMode(false);
            updateElement({ ...rootElement, data: newPageData }, { history: false });
            onClose();
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
                        <div className="info-wrapper">
                            <InfoIcon /> Click here to learn more about how page templates work
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <DialogCancel onClick={onClose}>Cancel</DialogCancel>
                        <ButtonPrimary disabled={!unlinkPermission} onClick={onUnlink}>
                            {unlinkPermission ? "Unlink template" : "No permissions"}
                        </ButtonPrimary>
                    </DialogActions>
                </Dialog>
            </>
        );
    };
});
