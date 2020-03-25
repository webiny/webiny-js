import React, { useState } from "react";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { useHotkeys } from "react-hotkeyz";
import { FormName, formNameWrapper, NameInputWrapper, NameWrapper } from "./NameStyled";
import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("ContentModelEditor.Name");

declare global {
    interface Window {
        Cypress: any;
    }
}

export const Name = () => {
    const { state, setData } = useContentModelEditor();
    const [localName, setLocalName] = useState(null);
    const [editingEnabled, setEditing] = useState(false);

    function cancelChanges() {
        setEditing(false);
    }

    function startEditing() {
        setLocalName(state.data.title);
        setEditing(true);
    }

    useHotkeys({
        zIndex: 100,
        keys: {
            "alt+cmd+enter": startEditing
        }
    });

    useHotkeys({
        zIndex: 101,
        disabled: !editingEnabled,
        keys: {
            esc: e => {
                e.preventDefault();
                cancelChanges();
            },
            enter: e => {
                e.preventDefault();
                setData(data => {
                    data.title = localName;
                    return data;
                });
                setEditing(false);
            }
        }
    });

    // Disable autoFocus because for some reason, blur event would automatically be triggered when clicking
    // on the page title when doing Cypress testing. Not sure if this is RMWC or Cypress related issue.
    const autoFocus = !window.Cypress;

    return editingEnabled ? (
        <NameInputWrapper>
            <Input
                autoFocus={autoFocus}
                fullwidth
                value={localName}
                onChange={setLocalName}
                onBlur={cancelChanges}
            />
        </NameInputWrapper>
    ) : (
        <NameWrapper>
            <Tooltip
                className={formNameWrapper}
                placement={"bottom"}
                content={<span>{t`rename`}</span>}
            >
                <FormName data-testid="fb-editor-form-title" onClick={startEditing}>
                    {state.data.title}
                </FormName>
            </Tooltip>
        </NameWrapper>
    );
};
