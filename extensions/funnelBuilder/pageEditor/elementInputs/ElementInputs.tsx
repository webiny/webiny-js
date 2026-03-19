import React from "react";
import { Button, useDialogs } from "webiny/admin/ui";
import { ElementInputs } from "webiny/admin/website-builder/page/editor";
import { useElementInputs } from "webiny/admin/website-builder/page/editor";
import { useComponent } from "webiny/admin/website-builder/page/editor";

export const ElementInputsDecorator = ElementInputs.createDecorator(Original => {
    return function FunnelElementSettings(props) {
        const { element } = props;
        const { inputs, updateInputs } = useElementInputs(element.id);
        const component = useComponent(element.component.name);
        const dialogs = useDialogs();

        const handleClick = () => {
            dialogs.showDialog({
                formData: inputs.registry,
                title: `Edit ${component.label} Settings`,
                content: <pre>{JSON.stringify(inputs, null, 2)}</pre>,
                acceptLabel: "Save Field Settings",
                cancelLabel: "Cancel",
                onAccept: (data: any) => {
                    console.log(data);
                    updateInputs(inputs => {
                        Object.assign(inputs.registry, data);
                    });
                }
            });
        };

        if (props.element.component.name.startsWith("FunnelBuilder/")) {
            return (
                <>
                    <Button
                        variant={"primary"}
                        text={`Edit ${component.label} Settings`}
                        className={"w-full"}
                        onClick={handleClick}
                    />
                    <pre>{JSON.stringify(element, null, 2)}</pre>
                </>
            );
        }
        return <Original {...props} />;
    };
});
