import React from "react";
import { Button } from "webiny/admin/ui";
import {
    $getElementInputValues,
    $getFirstElementOfType,
    Commands,
    useDocumentEditor,
    useSelectFromDocument,
    useSelectFromEditor
} from "webiny/admin/website-builder/page/editor";

type Inputs = {
    steps: Array<{ step: { label: string; children: string[] } }>;
};

export const StepsNavigator = () => {
    const editor = useDocumentEditor();
    const components = useSelectFromEditor(editor => editor.components);

    const elementId = useSelectFromDocument(state => {
        const funnel = $getFirstElementOfType(state, "FunnelBuilder/Funnel");
        return funnel ? funnel.id : null;
    });

    const inputs = useSelectFromDocument(
        doc => $getElementInputValues(doc, components, elementId, 1) as Inputs,
        [elementId, components]
    );

    const addStep = () => {
        if (!elementId) {
            return;
        }

        const totalSteps = inputs.steps?.length ?? 0;
        const insertIndex = Math.max(totalSteps - 1, 0);

        // Shift the last step to make room for the new one.
        if (totalSteps > 0) {
            const lastIndex = totalSteps - 1;
            const funnelBindings = editor.getDocumentState().read().bindings[elementId]?.inputs;
            const lastSlotKey = `steps/${lastIndex}/step`;
            const lastElementId = funnelBindings?.[lastSlotKey]?.static as string | undefined;

            if (lastElementId) {
                const newSlotKey = `steps/${totalSteps}/step`;

                editor.updateDocument(document => {
                    // Move the binding from old key to new key.
                    const parentInputs = document.bindings[elementId].inputs!;
                    parentInputs[newSlotKey] = { ...parentInputs[lastSlotKey] };
                    delete parentInputs[lastSlotKey];

                    // Update the element's parent slot reference.
                    document.elements[lastElementId].parent = {
                        id: elementId,
                        slot: newSlotKey
                    };
                });
            }
        }

        // Create the new step at the insert position.
        editor.executeCommand(Commands.CreateElement, {
            componentName: "FunnelBuilder/Step",
            parentId: elementId,
            slot: `steps/${insertIndex}/step`,
            index: -1,
            bindings: {
                inputs: {
                    label: `Step ${insertIndex + 1}`
                }
            }
        });
    };

    return (
        <div className={"flex flex-row p-sm bg-neutral-light justify-between"}>
            <div className={"flex gap-xs"}>
                {(inputs.steps ?? []).map((step, index) => (
                    <Button key={index} variant={"secondary"} text={step.step.label} />
                ))}
            </div>
            <Button variant={"primary"} text={"Add step"} onClick={addStep} />
        </div>
    );
};
