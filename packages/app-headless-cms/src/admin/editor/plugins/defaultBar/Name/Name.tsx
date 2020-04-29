import React, { useState } from "react";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Typography } from "@webiny/ui/Typography";
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
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";

const t = i18n.namespace("FormEditor.Name");

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
    // @ts-ignore
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
            <FormMeta>
                <Typography use={"overline"}>
                    {`status: ${state.data.published ? t`published` : t`draft`}`}
                </Typography>
            </FormMeta>
            <div style={{ width: "100%", display: "flex" }}>
                <Tooltip
                    className={formNameWrapper}
                    placement={"bottom"}
                    content={<span>{t`rename`}</span>}
                >
                    <FormName data-testid="fb-editor-form-title" onClick={startEditing}>
                        {state.data.title}
                    </FormName>
                </Tooltip>
                <FormVersion>{`(v${state.data.version})`}</FormVersion>
            </div>
        </NameWrapper>
    );
};
