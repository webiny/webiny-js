import React, { useState } from "react";
import { Input } from "webiny-ui/Input";
import { Tooltip } from "webiny-ui/Tooltip";
import { Typography } from "webiny-ui/Typography";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor";
import { useHotkeys } from "react-hotkeyz";

import {
    FormMeta,
    FormTitle,
    formTitleWrapper,
    FormVersion,
    TitleInputWrapper,
    TitleWrapper
} from "./TitleStyled";

export const Title = () => {
    const { state, setTitle } = useFormEditor();
    const [localTitle, setLocalTitle] = useState(null);
    const [editingEnabled, setEditing] = useState(false);

    function cancelChanges() {
        setEditing(false);
    }

    function startEditing() {
        setLocalTitle(state.data.title);
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
                setTitle(localTitle);
                setEditing(false);
            }
        }
    });

    return editingEnabled ? (
        <TitleInputWrapper>
            <Input
                autoFocus
                fullwidth
                value={localTitle}
                onChange={setLocalTitle}
                onBlur={cancelChanges}
            />
        </TitleInputWrapper>
    ) : (
        <TitleWrapper>
            <FormMeta>
                <Typography use={"overline"}>
                    {`status: ${state.data.locked ? "published" : "draft"}`}
                </Typography>
            </FormMeta>
            <div style={{ width: "100%", display: "flex" }}>
                <Tooltip
                    className={formTitleWrapper}
                    placement={"bottom"}
                    content={<span>Rename</span>}
                >
                    <FormTitle onClick={startEditing}>{state.data.title}</FormTitle>
                </Tooltip>
                <FormVersion>{`(v${state.data.version})`}</FormVersion>
            </div>
        </TitleWrapper>
    );
};
