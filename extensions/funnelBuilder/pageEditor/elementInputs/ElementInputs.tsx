import React from "react";
import { Button } from "webiny/admin/ui";
import { useElementInputValues, ElementInputs, useComponent } from "webiny/admin/website-builder/page/editor";
import {
    useInputValue
} from "@/packages/app-website-builder/src/BaseEditor/defaultConfig/Sidebar/ElementSettings/useInputValue.js";

export const ElementInputsDecorator = ElementInputs.createDecorator(Original => {
    return function FunnelElementSettings(props) {
        const { element } = props;
        const inputValues = useElementInputValues(element.id);

        const component = useComponent(element.component.name);

        if (props.element.component.name.startsWith("FunnelBuilder/")) {
            return (
                <>
                    <Button
                        variant={"primary"}
                        text={`Edit ${component.label} Settings`}
                        className={"w-full"}
                    />
                    <pre>{JSON.stringify(element, null, 2)}</pre>
                    <pre>{JSON.stringify(inputValues, null, 2)}</pre>
                </>
            );
        }
        return <Original {...props} />;
    };
});
