import React, { useMemo } from "react";
import { Grid } from "@webiny/admin-ui";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import { useComponent } from "~/BaseEditor/hooks/useComponent";
import { InputRenderer } from "./InputRenderer";
import { ComponentManifestToAstConverter } from "@webiny/website-builder-sdk";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument";
import { InfoMessage } from "~/BaseEditor/defaultConfig/Sidebar/InfoMessage";

interface ElementInputsProps {
    element: DocumentElement;
}

export const ElementInputs = ({ element }: ElementInputsProps) => {
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

    if (!element) {
        return null;
    }

    if (!hasEditableInputs) {
        return <InfoMessage message={"This element has no inputs."} />;
    }

    return (
        <Grid>
            {/*<Grid.Column key={"repeat"} span={12}>*/}
            {/*    <Select*/}
            {/*        label={"Repeat for each"}*/}
            {/*        placeholder={"Select binding"}*/}
            {/*        options={arrayOptions}*/}
            {/*        value={repeat.value ?? ""}*/}
            {/*        onChange={value => repeat.onChange(value === "" ? undefined : value)}*/}
            {/*    />*/}
            {/*</Grid.Column>*/}
            <InputRenderer key={element.id} ast={inputsAst} bindings={bindings.inputs} />
        </Grid>
    );
};

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
