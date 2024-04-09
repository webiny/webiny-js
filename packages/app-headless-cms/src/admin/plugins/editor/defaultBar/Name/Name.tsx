import React, { useCallback, useState } from "react";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
/**
 * Package react-hotkeyz does not have types.
 */
// @ts-expect-error
import { useHotkeys } from "react-hotkeyz";
import { FormName, formNameWrapper, NameInputWrapper, NameWrapper } from "./NameStyled";
import { i18n } from "@webiny/app/i18n";
import { useModelEditor } from "~/admin/hooks";

const t = i18n.namespace("ContentModelEditor.Name");

declare global {
    interface Window {
        Cypress: any;
    }
}

export const Name = () => {
    const { data, setData } = useModelEditor();
    const [localName, setLocalName] = useState<string>("");
    const [editingEnabled, setEditing] = useState<boolean>(false);

    const cancelChanges = () => {
        setEditing(false);
    };

    const startEditing = (): void => {
        setLocalName(data.name);
        setEditing(true);
    };

    const saveName = useCallback(
        (event: React.SyntheticEvent) => {
            event.preventDefault();
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
            esc: (event: React.SyntheticEvent) => {
                event.preventDefault();
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
