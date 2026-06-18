import React, { useCallback, useState } from "react";
import { useHotkeys } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import { useModelEditor } from "~/admin/hooks/index.js";
import { EditableTitle } from "@webiny/admin-ui";

const t = i18n.namespace("ContentModelEditor.Name");

declare global {
    interface Window {
        Cypress: any;
    }
}

export const Name = () => {
    const { data, setData } = useModelEditor();
    const [editing, setEditing] = useState<boolean>(false);

    const saveName = useCallback(
        (name: string) => {
            setData(data => {
                data.name = name;
                return data;
            });
        },
        [setData]
    );

    useHotkeys({
        zIndex: 100,
        keys: {
            "alt+cmd+enter": () => setEditing(true)
        }
    });

    // Disable autoFocus because for some reason, blur event would automatically be triggered when clicking
    // on the page title when doing Cypress testing. Not sure if this is RMWC or Cypress related issue.
    const autoFocus = !window.Cypress;

    return (
        <EditableTitle
            value={data.name}
            onCommit={saveName}
            autoFocus={autoFocus}
            isEditing={editing}
            onEditingChange={setEditing}
            tooltip={<span>{t`Rename content model`}</span>}
            data-testid="cms-editor-model-title"
            value={localName}
            onChange={setLocalName}
            onBlur={saveName}
            variant={"ghost"}
            size={"md"}
        />
    ) : (
        <Tooltip
            side={"bottom"}
            content={<span>{t`Rename content model`}</span>}
            trigger={
                <Heading
                    level={5}
                    className={
                        "px-xs text-accent-primary border-sm border-neutral-base rounded-md hover:border-neutral-muted"
                    }
                    data-testid="cms-editor-model-title"
                    onClick={startEditing}
                >
                    {data.name}
                </Heading>
            }
        />
    );
};
