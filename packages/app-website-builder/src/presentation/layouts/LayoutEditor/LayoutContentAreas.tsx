import { useEffect } from "react";
import { LayoutContentArea } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/commands.js";
import { CommandPriority } from "~/editorSdk/CommandBus.js";

/**
 * Named content inserted into a layout gets a name of its own (`area-2`, ...), so authors can tell the
 * areas apart. It's only a label, and can be renamed in its settings.
 */
export const LayoutContentAreas = () => {
    const editor = useDocumentEditor();

    useEffect(() => {
        return editor.registerCommandHandler(
            Commands.CreateElement,
            (payload, control) => {
                if (
                    payload.componentName !== LayoutContentArea.NAMED_COMPONENT ||
                    payload.bindings
                ) {
                    return;
                }

                const document = editor.getDocumentState().read();
                const names = new Set(LayoutContentArea.allIn(document).map(area => area.name()));

                let index = names.size + 1;
                while (names.has(`area-${index}`)) {
                    index++;
                }

                editor.executeCommand(Commands.CreateElement, {
                    ...payload,
                    bindings: { inputs: { [LayoutContentArea.NAME_INPUT]: `area-${index}` } }
                });

                return control.stop();
            },
            CommandPriority.HIGH
        );
    }, [editor]);

    return null;
};
