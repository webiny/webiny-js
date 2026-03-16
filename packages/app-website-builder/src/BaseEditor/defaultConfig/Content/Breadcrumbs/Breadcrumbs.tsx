import React, { useCallback } from "react";
import { breadcrumbs } from "./styles.js";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { $getComponentManifestByElementId } from "~/editorSdk/utils/index.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";

export const Breadcrumbs = () => {
    const [activeElement] = useActiveElement();
    const editor = useDocumentEditor();

    const items = useSelectFromDocument(
        document => {
            if (!activeElement) {
                return [];
            }

            const items = [];
            let element = document.elements[activeElement.id];

            while (element) {
                const component = $getComponentManifestByElementId(editor, element.id)!;
                if (!component) {
                    continue;
                }

                items.push({
                    id: element.id,
                    label: component.label
                });

                if (element.parent?.id === "root") {
                    break;
                }

                element = document.elements[element.parent!.id];
            }

            return items.reverse();
        },
        [activeElement?.id]
    );

    const highlightElement = useCallback((id: string) => {
        editor.executeCommand(Commands.HighlightElement, { id });
    }, []);

    const activateElement = useCallback((id: string) => {
        editor.executeCommand(Commands.SelectElement, { id });
    }, []);

    return (
        <ul
            className={breadcrumbs}
            data-role={"content-breadcrumbs"}
            data-hover-manager={"ignore"}
            data-affects-preview={"height"}
        >
            {items.map(({ id, label }, index) => (
                <li
                    key={id}
                    onMouseOver={() => highlightElement(id)}
                    onClick={() => activateElement(id)}
                >
                    <span
                        className={"element"}
                        style={{ "--element-count": index } as React.CSSProperties}
                    >
                        {label}
                    </span>
                </li>
            ))}
        </ul>
    );
};
