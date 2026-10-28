import React, { useCallback, useState } from "react";
import { useHotkeys } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import { useModelEditor } from "~/admin/hooks/index.js";
import { EditableTitle } from "@webiny/admin-ui";

const t = i18n.namespace("ContentModelEditor.Name");

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

    return (
        <EditableTitle
            value={data.name}
            onCommit={saveName}
            isEditing={editing}
            onEditingChange={setEditing}
            tooltip={<span>{t`Rename content model`}</span>}
            data-testid="cms-editor-model-title"
        />
    );
};
