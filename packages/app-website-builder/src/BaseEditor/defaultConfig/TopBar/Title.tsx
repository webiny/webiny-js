import React, { useCallback, useState } from "react";
import { Input, Text } from "@webiny/admin-ui";
import { useDocumentEditor } from "~/DocumentEditor";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument";

export function Title() {
    const [localValue, setLocalValue] = useState<string | undefined>();
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const editor = useDocumentEditor();

    const { title } = useSelectFromDocument(document => {
        return {
            title: document.properties.title ?? "Untitled"
        };
    });

    const commitValue = useCallback((value: string) => {
        editor.updateDocument(document => {
            document.properties.title = value;
        });
        setLocalValue(undefined);
        setIsEditing(false);
    }, []);

    const cancelEditing = useCallback(() => {
        setIsEditing(false);
        setLocalValue(undefined);
    }, []);

    return (
        <div className={"wby-flex wby-flex-col"}>
            {!isEditing ? (
                <Text
                    onClick={() => setIsEditing(true)}
                    className={"wby-cursor-pointer wby-text-accent-primary wby-font-bold wby-mx-sm"}
                    size={"lg"}
                >
                    {title}
                </Text>
            ) : null}
            {isEditing ? (
                <Input
                    autoFocus
                    autoSelect
                    size={"md"}
                    variant={"secondary"}
                    value={localValue ?? title}
                    onChange={setLocalValue}
                    onBlur={e => commitValue(e.currentTarget.value)}
                    onEnter={e => commitValue(e.currentTarget.value)}
                    onEscape={cancelEditing}
                />
            ) : null}
        </div>
    );
}
