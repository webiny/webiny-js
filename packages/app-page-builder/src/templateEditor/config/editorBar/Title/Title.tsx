import React, { useState, useCallback, SyntheticEvent, useEffect } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
import { createDecorator } from "@webiny/app-admin";
import { TemplateTitle, templateTitleWrapper, TitleInputWrapper, TitleWrapper } from "./Styled";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { PageTemplate } from "~/templateEditor/state";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { EditorBar } from "~/editor";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";

declare global {
    interface Window {
        Cypress: any;
    }
}

const Title = () => {
    const handler = useEventActionHandler();
    const [template] = useTemplate();
    const { showSnackbar } = useSnackbar();
    const [editTitle, setEdit] = useState<boolean>(false);
    const [stateTitle, setTitle] = useState<string | null>(null);
    let title = stateTitle === null ? template.title : stateTitle;

    useEffect(() => {
        if (template.title && template.title !== stateTitle) {
            setTitle(template.title);
        }
    }, [template.title]);

    const updateTemplate = (data: Partial<PageTemplate>) => {
        handler.trigger(
            new UpdateDocumentActionEvent({
                history: false,
                document: data,
                onFinish: () => {
                    showSnackbar(`Template title updated successfully!`);
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
        updateTemplate({ title: title });
    }, [title]);

    const onKeyDown = useCallback(
        (e: SyntheticEvent) => {
            // @ts-expect-error
            switch (e.key) {
                case "Escape":
                    e.preventDefault();
                    setEdit(false);
                    setTitle(template.title || "");
                    break;
                case "Enter":
                    if (title === "") {
                        title = "Untitled";
                        setTitle(title);
                    }

                    e.preventDefault();
                    setEdit(false);

                    updateTemplate({ title: title });
                    break;
                default:
                    return;
            }
        },
        [title, template.title]
    );

    // Disable autoFocus because for some reason, blur event would automatically be triggered when clicking
    // on the template title when doing Cypress testing. Not sure if this is RMWC or Cypress related issue.
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
                    className={templateTitleWrapper}
                    placement={"bottom"}
                    content={<span>Rename</span>}
                >
                    <TemplateTitle data-testid="pb-editor-page-title" onClick={enableEdit}>
                        {title}
                    </TemplateTitle>
                </Tooltip>
            </div>
        </TitleWrapper>
    );
};

export const TitlePlugin = createDecorator(EditorBar.LeftSection, LeftSection => {
    return function AddTitle(props) {
        return (
            <LeftSection>
                {props.children}
                <Title />
            </LeftSection>
        );
    };
});
