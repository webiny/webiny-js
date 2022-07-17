import React, { useState, useCallback, SyntheticEvent } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
import { createComponentPlugin } from "@webiny/app-admin";
import { BlockTitle, blockTitleWrapper, TitleInputWrapper, TitleWrapper } from "./Styled";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { BlockAtomType } from "~/blockEditor/state";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { EditorBar } from "~/editor";
import { useBlock } from "~/blockEditor/hooks/useBlock";

declare global {
    interface Window {
        Cypress: any;
    }
}

const Title: React.FC = () => {
    const handler = useEventActionHandler();
    const [block] = useBlock();
    const { showSnackbar } = useSnackbar();
    const [editTitle, setEdit] = useState<boolean>(false);
    const [stateTitle, setTitle] = useState<string | null>(null);
    let title = stateTitle === null ? block.title : stateTitle;

    const updateBlock = (data: Partial<BlockAtomType>) => {
        handler.trigger(
            new UpdateDocumentActionEvent({
                history: false,
                document: data,
                onFinish: () => {
                    showSnackbar(`Block title updated successfully!`);
                }
            })
        );
    };

    const enableEdit = useCallback(() => setEdit(true), []);

    const onBlur = useCallback(() => {
        if (title === "") {
            title = "Untitled";
            setTitle(title);
        }
        setEdit(false);
        updateBlock({ title });
    }, [title]);

    const onKeyDown = useCallback(
        (e: SyntheticEvent) => {
            // @ts-ignore
            switch (e.key) {
                case "Escape":
                    e.preventDefault();
                    setEdit(false);
                    setTitle(block.title || "");
                    break;
                case "Enter":
                    if (title === "") {
                        title = "Untitled";
                        setTitle(title);
                    }

                    e.preventDefault();
                    setEdit(false);

                    updateBlock({ title });
                    break;
                default:
                    return;
            }
        },
        [title, block.title]
    );

    // Disable autoFocus because for some reason, blur event would automatically be triggered when clicking
    // on the page title when doing Cypress testing. Not sure if this is RMWC or Cypress related issue.
    const autoFocus = !window.Cypress;

    return editTitle ? (
        <TitleInputWrapper>
            <Input
                autoFocus={autoFocus}
                fullwidth
                value={title}
                onChange={setTitle}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
            />
        </TitleInputWrapper>
    ) : (
        <TitleWrapper>
            <div style={{ width: "100%", display: "flex" }}>
                <Tooltip
                    className={blockTitleWrapper}
                    placement={"bottom"}
                    content={<span>Rename</span>}
                >
                    <BlockTitle data-testid="pb-editor-page-title" onClick={enableEdit}>
                        {title}
                    </BlockTitle>
                </Tooltip>
            </div>
        </TitleWrapper>
    );
};

export const TitlePlugin = createComponentPlugin(EditorBar.LeftSection, LeftSection => {
    return function AddTitle(props) {
        return (
            <LeftSection>
                {props.children}
                <Title />
            </LeftSection>
        );
    };
});
