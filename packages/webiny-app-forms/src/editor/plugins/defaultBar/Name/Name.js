import React, { useState } from "react";
import { Input } from "webiny-ui/Input";
import { Tooltip } from "webiny-ui/Tooltip";
import { Typography } from "webiny-ui/Typography";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { useHotkeys } from "react-hotkeyz";
import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormEditor.Name");

import {
    FormMeta,
    FormName,
    formNameWrapper,
    FormVersion,
    NameInputWrapper,
    NameWrapper
} from "./NameStyled";

export const Name = () => {
    const { state, setName } = useFormEditor();
    const [localName, setLocalName] = useState(null);
    const [editingEnabled, setEditing] = useState(false);

    function cancelChanges() {
        setEditing(false);
    }

    function startEditing() {
        setLocalName(state.data.name);
        setEditing(true);
    }

    useHotkeys({
        zIndex: 100,
        keys: {
            "alt+cmd+enter": startEditing,
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
                setName(localName);
                setEditing(false);
            }
        }
    });

    return editingEnabled ? (
        <NameInputWrapper>
            <Input
                autoFocus
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
                    {`status: ${state.data.locked ? t`published` : t`draft`}`}
                </Typography>
            </FormMeta>
            <div style={{ width: "100%", display: "flex" }}>
                <Tooltip
                    className={formNameWrapper}
                    placement={"bottom"}
                    content={<span>{t`rename`}</span>}
                >
                    <FormName onClick={startEditing}>{state.data.name}</FormName>
                </Tooltip>
                <FormVersion>{`(v${state.data.version})`}</FormVersion>
            </div>
        </NameWrapper>
    );
};
