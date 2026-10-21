import React, { useMemo } from "react";
import { Grid } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/app-admin";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import { useComponent } from "~/BaseEditor/hooks/useComponent.js";
import { InputRenderer } from "./InputRenderer.js";
import { ComponentManifestToAstConverter, LayoutContentArea } from "@webiny/website-builder-sdk";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { InfoMessage } from "~/BaseEditor/defaultConfig/Sidebar/InfoMessage.js";
import { $isLayoutElement } from "~/editorSdk/utils/$getEditableElement.js";

interface ElementInputsProps {
    element: DocumentElement;
}

const getLayoutAreaMessage = (area: string | null) => {
    if (area === LayoutContentArea.MAIN) {
        return "This is the layout's main content area. Drop this page's content into it.";
    }
    if (area) {
        return `This is the layout's "${area}" content area. Drop this page's content into it. Rename it in the layout editor.`;
    }
    return "This is one of the layout's named content areas. Drop this page's content into it. Name it in the layout editor.";
};

export const ElementInputs = makeDecoratable("ElementInputs", ({ element }: ElementInputsProps) => {
    const component = useComponent(element.component.name);

    const bindings = useSelectFromDocument(
        document => {
            return document.bindings[element.id] ?? { inputs: {} };
        },
        [element.id]
    );

    const inputsAst = useMemo(() => {
        return ComponentManifestToAstConverter.convert(component.inputs ?? []);
    }, [component.name, element.id]);

    const hasEditableInputs = useMemo(() => {
        return inputsAst.filter(input => input.type !== "slot").length > 0;
    }, [inputsAst]);

    // In the page editor, a content area of the page's layout: `null` for a named area without a name.
    const layoutAreaName = useSelectFromDocument(
        document => {
            if (!$isLayoutElement(document, element.id)) {
                return undefined;
            }
            const area = LayoutContentArea.from(document.layout!, element.id);
            return area ? area.name() : undefined;
        },
        [element.id]
    );

    if (!element) {
        return null;
    }

    // An area belongs to the layout: a page can't rename it. (ElementSettings renders the preview above.)
    if (layoutAreaName !== undefined) {
        return (
            <Grid gap={"compact"} className={"pt-md px-sm"}>
                <Grid.Column span={12}>
                    <InfoMessage message={getLayoutAreaMessage(layoutAreaName)} />
                </Grid.Column>
            </Grid>
        );
    }

    return (
        <Grid gap={"compact"} className={"pt-md px-sm"}>
            {!hasEditableInputs ? (
                <Grid.Column span={12}>
                    <InfoMessage message={"This element has no inputs."} />
                </Grid.Column>
            ) : (
                <></>
            )}

            <InputRenderer key={element.id} ast={inputsAst} bindings={bindings.inputs} />
        </Grid>
    );
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
