import React, { useMemo } from "react";
import { Grid } from "@webiny/admin-ui";
import { createReactiveComponent, makeDecoratable } from "@webiny/app-admin";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import { ComponentManifestToAstConverter } from "@webiny/website-builder-sdk";
import { useComponent } from "~/BaseEditor/hooks/useComponent.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { InfoMessage } from "~/BaseEditor/defaultConfig/Sidebar/InfoMessage.js";
import { useElementSidebar } from "~/BaseEditor/defaultConfig/Sidebar/ElementSidebar/useElementSidebar.js";
import { InputRenderer } from "./InputRenderer.js";

interface ElementInputsProps {
    element: DocumentElement;
}

const ElementInputsView = createReactiveComponent(({ element }: ElementInputsProps) => {
    const component = useComponent(element.component.name);
    const presenter = useElementSidebar();

    const bindings = useSelectFromDocument(
        document => {
            return document.bindings[element.id] ?? { inputs: {} };
        },
        [element.id]
    );

    const inputsAst = useMemo(() => {
        return ComponentManifestToAstConverter.convert(component.inputs ?? []);
    }, [component.name, element.id]);

    if (!element) {
        return null;
    }

    const settings = presenter.getSettings(element.id);

    // An area belongs to the layout: a page can't rename it. (ElementSettings renders the preview above.)
    if (settings.layoutArea) {
        return (
            <Grid gap={"compact"} className={"pt-md px-sm"}>
                <Grid.Column span={12}>
                    <InfoMessage message={settings.layoutArea.description} />
                </Grid.Column>
            </Grid>
        );
    }

    return (
        <Grid gap={"compact"} className={"pt-md px-sm"}>
            {settings.message ? (
                <Grid.Column span={12}>
                    <InfoMessage message={settings.message} />
                </Grid.Column>
            ) : (
                <></>
            )}

            <InputRenderer key={element.id} ast={inputsAst} bindings={bindings.inputs} />
        </Grid>
    );
});

export const ElementInputs = makeDecoratable("ElementInputs", (props: ElementInputsProps) => {
    return <ElementInputsView {...props} />;
});

// interface ElementInputProps {
//     element: DocumentElement;
//     input: ComponentInput;
// }
//
// const ElementInput = ({ element, input }: ElementInputProps) => {
//     const Renderer = useInputRenderer(input.renderer || "__unknown__");
//
//     const { value, onChange, onPreviewChange, setBindingType } = useInputValue(element, input);
//
//     /*   return (
//         <Renderer
//             value={value.static}
//             input={input}
//             onChange={onChange}
//             onPreviewChange={onPreviewChange}
//         />
//     );*/
//     if (value.expression) {
//         return (
//             <WithBindingToggle type={"expression"} setBindingType={setBindingType}>
//                 <ExpressionRenderer
//                     element={element}
//                     value={value.expression}
//                     onChange={onChange}
//                     input={input}
//                 />
//             </WithBindingToggle>
//         );
//     }
//
//     return (
//         <WithBindingToggle type={"static"} setBindingType={setBindingType}>
//             <Renderer
//                 value={value.static}
//                 input={input}
//                 onChange={onChange}
//                 onPreviewChange={onPreviewChange}
//             />
//         </WithBindingToggle>
//     );
// };
