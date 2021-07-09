import React, { useCallback, useState } from "react";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useHotkeys } from "react-hotkeyz";
import { FormName, formNameWrapper, NameInputWrapper, NameWrapper } from "./NameStyled";
import { i18n } from "@webiny/app/i18n";
import {useContentModelEditor} from "~/admin/components/ContentModelEditor/useContentModelEditor";

const t = i18n.namespace("ContentModelEditor.Name");

declare global {
    interface Window {
        Cypress: any;
    }
}

export const Name = () => {
    const { data, setData } = useContentModelEditor();
    const [localName, setLocalName] = useState(null);
    const [editingEnabled, setEditing] = useState(false);

    const cancelChanges = () => {
        setEditing(false);
    };

    const startEditing = () => {
        setLocalName(data.name);
        setEditing(true);
    };

    const saveName = useCallback(
        e => {
            e.preventDefault();
            setData(data => {
                data.name = localName;
                return data;
            });
            setEditing(false);
        },
        [localName]
    );

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
            enter: saveName
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
                onBlur={saveName}
            />
        </NameInputWrapper>
    ) : (
        <NameWrapper>
            <Tooltip
                className={formNameWrapper}
                placement={"bottom"}
                content={<span>{t`rename`}</span>}
            >
                <FormName data-testid="cms-editor-model-title" onClick={startEditing}>
                    {data.name}
                </FormName>
            </Tooltip>
        </NameWrapper>
    );
};
