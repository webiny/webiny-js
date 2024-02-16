import React, { useCallback, useState } from "react";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Typography } from "@webiny/ui/Typography";
import { useFormEditor } from "~/admin/components/FormEditor";
/**
 * Package react-hotkeyz does not have types.
 */
// @ts-expect-error
import { useHotkeys } from "react-hotkeyz";
import {
    FormMeta,
    FormName,
    formNameWrapper,
    FormVersion,
    NameInputWrapper,
    NameWrapper
} from "./NameStyled";
import { i18n } from "@webiny/app/i18n";
import { FORM_STATUS } from "~/types";

const t = i18n.namespace("FormEditor.Name");

declare global {
    interface Window {
        Cypress: any;
    }
}

export const Name = () => {
    const { state, setData } = useFormEditor();
    const [localName, setLocalName] = useState("");
    const [editingEnabled, setEditing] = useState<boolean>(false);

    const cancelChanges = useCallback(() => {
        setEditing(false);
    }, []);

    const startEditing = useCallback(() => {
        setLocalName(state.data.name);
        setEditing(true);
    }, [state.data]);

    const saveTitle = useCallback(
        (event: React.SyntheticEvent) => {
            event.preventDefault();
            setData(data => {
                data.name = localName || "";
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
            esc: (event: React.KeyboardEvent) => {
                event.preventDefault();
                cancelChanges();
            },
            enter: saveTitle
        }
    });

    // Disable autoFocus because for some reason, blur event would automatically be triggered when clicking
    // on the page title when doing Cypress testing. Not sure if this is RMWC or Cypress related issue.
    const autoFocus = !window.Cypress;

    if (editingEnabled) {
        return (
            <NameInputWrapper>
                <Input
                    autoFocus={autoFocus}
                    fullwidth
                    value={localName}
                    onChange={setLocalName}
                    onBlur={saveTitle}
                />
            </NameInputWrapper>
        );
    }

    return (
        <NameWrapper>
            <FormMeta>
                <Typography use={"overline"}>{`status: ${
                    state.data.status === FORM_STATUS.PUBLISHED ? t`published` : t`draft`
                }`}</Typography>
            </FormMeta>
            <div style={{ width: "100%", display: "flex" }}>
                <Tooltip
                    className={formNameWrapper}
                    placement={"bottom"}
                    content={<span>{t`rename`}</span>}
                >
                    <FormName
                        data-testid="fb-editor-form-title"
                        onClick={() => {
                            startEditing();
                        }}
                    >
                        {state.data.name}
                    </FormName>
                </Tooltip>
                <FormVersion>{`(v${state.data.version})`}</FormVersion>
            </div>
        </NameWrapper>
    );
};
