import React, { useCallback, useState } from "react";
import { Input, Text } from "@webiny/admin-ui";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { LanguageCodeTag } from "~/presentation/components/LanguageCodeTag.js";

export function Title() {
    const [localValue, setLocalValue] = useState<string | undefined>();
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const isEditorReadOnly = useSelectFromEditor(state => state.isReadOnly);

    const editor = useDocumentEditor();

    const { title, language } = useSelectFromDocument(document => {
        return {
            title: document.properties.title ?? "Untitled",
            language: document.properties.language ?? undefined
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

    if (isEditorReadOnly) {
        return (
            <div className={"flex flex-col min-w-0"}>
                <Text className={"text-accent-primary font-bold mx-sm truncate"} size={"lg"}>
                    {title}
                </Text>
            </div>
        );
    }

    return (
        <div className={"flex flex-row min-w-0"}>
            <LanguageCodeTag code={language} />
            {!isEditing ? (
                <Text
                    onClick={() => setIsEditing(true)}
                    className={"cursor-pointer text-accent-primary font-bold mx-sm truncate"}
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
                    className={"mx-sm"}
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
