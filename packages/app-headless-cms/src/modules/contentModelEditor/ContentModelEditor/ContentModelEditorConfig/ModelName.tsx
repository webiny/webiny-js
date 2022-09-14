import React, { useCallback, useState } from "react";
import { Input } from "@webiny/ui/Input";
import { Tooltip } from "@webiny/ui/Tooltip";
/**
 * Package react-hotkeyz does not have types.
 */
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import { i18n } from "@webiny/app/i18n";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Editor, useContentModelEditor } from "~/modelEditor";
import { createComponentPlugin } from "@webiny/react-composition";

const t = i18n.namespace("ContentModelEditor.Name");

export const NameInputWrapper = styled("div")({
    width: "100%",
    display: "flex",
    alignItems: "center",
    position: "relative",
    "> .mdc-text-field--upgraded": {
        height: 35,
        marginTop: "0 !important",
        paddingLeft: 10,
        paddingRight: 40
    }
});

export const NameWrapper = styled("div")({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "flex-center",
    flexDirection: "column",
    color: "var(--mdc-theme-text-primary-on-background)",
    position: "relative",
    width: "100%",
    marginLeft: 10
});

export const FormName = styled("div")({
    border: "1px solid transparent",
    fontSize: 20,
    lineHeight: 1.25,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
    "&:hover": {
        border: "1px solid var(--mdc-theme-on-background)"
    }
});

export const formNameWrapper = css({
    maxWidth: "calc(100% - 50px)"
});

declare global {
    interface Window {
        Cypress: any;
    }
}

export const ModelName = createComponentPlugin(Editor.Header.LeftSection, Original => {
    return function LeftSection({ children }) {
        const { data, setData } = useContentModelEditor();
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

        const nameElement = editingEnabled ? (
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

        return (
            <Original>
                {nameElement}
                {children}
            </Original>
        );
    };
});
