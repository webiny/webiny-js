import React from "react";
import { Button } from "webiny/admin/ui";
import { ElementInputs } from "webiny/admin/website-builder/page/editor";
import { useDocumentEditor } from "webiny/admin/website-builder/page/editor";
import { useElementComponentManifest } from "webiny/admin/website-builder/page/editor";
import { OpenSettingsDialog } from "@/extensions/funnelBuilder/pageEditor/components/commands/OpenSettingsDialog.js";

export const FieldSettingsButton = ElementInputs.createDecorator(Original => {
    return function FieldElementSettings(props) {
        const editor = useDocumentEditor();
        const { element } = props;
        const component = useElementComponentManifest(element.id);

        if (!element.component.name.startsWith("Fub/Field/")) {
            return <Original {...props} />;
        }

        const handleClick = () => {
            editor.executeCommand(OpenSettingsDialog, { elementId: element.id });
        };

        return (
            <Button
                variant={"primary"}
                text={`Edit ${component.label} Settings`}
                className={"w-full"}
                onClick={handleClick}
            />
        );
    };
});
