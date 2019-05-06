import React, { useState, useContext } from "react";
import { Input } from "webiny-ui/Input";
import { Tooltip } from "webiny-ui/Tooltip";
import { Typography } from "webiny-ui/Typography";
import { FormEditorContext } from "webiny-app-forms/admin/components/FormEditor";

import {
    FormMeta,
    FormTitle,
    formTitleWrapper,
    FormVersion,
    TitleInputWrapper,
    TitleWrapper
} from "./TitleStyled";

export const Title = () => {
    const { formState, setFormState } = useContext(FormEditorContext);
    const [editTitle, setEdit] = useState(false);
    let [title, setTitle] = useState(null);

    if (title === null && formState.title) {
        title = formState.title;
    }

    function onKeyDown(e) {
        switch (e.key) {
            case "Escape":
                e.preventDefault();
                setEdit(false);
                setTitle(null);
                break;
            case "Enter":
                e.preventDefault();

                if (title === "") {
                    title = "Untitled";
                }

                setEdit(false);
                setTitle(null);

                setFormState(state => {
                    return { ...state, title };
                });
                break;
            default:
                return;
        }
    }

    function onBlur() {
        if (title === "") {
            title = "Untitled";
        }
        setEdit(false);
        setTitle(null);
        setFormState(state => {
            return { ...state, title };
        });
    }

    return editTitle ? (
        <TitleInputWrapper>
            <Input
                autoFocus
                fullwidth
                value={title}
                onChange={setTitle}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
            />
        </TitleInputWrapper>
    ) : (
        <TitleWrapper>
            <FormMeta>
                <Typography use={"overline"}>
                    {`status: ${formState.locked ? "published" : "draft"}`}
                </Typography>
            </FormMeta>
            <div style={{ width: "100%", display: "flex" }}>
                <Tooltip
                    className={formTitleWrapper}
                    placement={"bottom"}
                    content={<span>Rename</span>}
                >
                    <FormTitle onClick={() => setEdit(true)}>{title}</FormTitle>
                </Tooltip>
                <FormVersion>{`(v${formState.version})`}</FormVersion>
            </div>
        </TitleWrapper>
    );
};
