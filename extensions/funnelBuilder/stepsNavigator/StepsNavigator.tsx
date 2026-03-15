import React from "react";
import { Button, Icon } from "webiny/admin/ui";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/close.svg";
import {
    $createElement,
    $updateElementInputs,
    Commands,
    createElement,
    useDocumentEditor
} from "webiny/admin/website-builder/page/editor";
import { useFunnel } from "./useFunnel.js";

const iconClasses =
    "absolute z-10 rounded-full bg-neutral-dimmed border-solid border-sm border-neutral-muted cursor-pointer fill-neutral-strong";

const iconPosition = {
    top: -8,
    right: -8
};

export const StepsNavigator = () => {
    const editor = useDocumentEditor();
    const funnel = useFunnel();

    if (!funnel) {
        return null;
    }

    const activeStep = funnel.inputs.activeStep;

    const activateStep = (index: number) => {
        $updateElementInputs(editor, funnel.id, inputs => {
            inputs.activeStep = index;
        });
    };

    const deleteStep = (stepElementId: string) => {
        editor.executeCommand(Commands.DeleteElement, { id: stepElementId });
    };

    const addStep = () => {
        const steps = funnel.inputs.steps ?? [];
        const insertIndex = Math.max(steps.length - 1, 0);

        editor.updateDocument(() => {
            $updateElementInputs(editor, funnel.id, inputs => {
                const steps = inputs.steps ?? [];
                steps.splice(
                    insertIndex,
                    0,
                    createElement({
                        component: "FunnelBuilder/Step",
                        inputs: { label: `Step ${steps.length}` }
                    })
                );
                inputs.steps = steps;
                inputs.activeStep = insertIndex;
            });

            editor.updateEditor(state => {
                state["activeStep"] = insertIndex;
            })
        });

        // editor.updateDocument(() => {
        //     $createElement(editor, {
        //         componentName: "FunnelBuilder/Step",
        //         parentId: funnel.id,
        //         slot: "steps",
        //         index: insertIndex,
        //         bindings: {
        //             inputs: {
        //                 label: `Step ${steps.length}`
        //             }
        //         }
        //     });
        //     $updateElementInputs(editor, funnel.id, inputs => {
        //         inputs.activeStep = insertIndex;
        //     });
        // })
    };

    return (
        <div className={"flex flex-row p-sm bg-neutral-light justify-between"}>
            <div className={"flex gap-md"}>
                {(funnel.inputs.steps ?? []).map((step, index) => {
                    const isFirstStep = index === 0;
                    const isLastStep = index === funnel.inputs.steps.length - 1;
                    const canDelete = !isFirstStep && !isLastStep;
                    const activeVariant = activeStep === index ? "primary" : "secondary";

                    return (
                        <div className={"relative"} key={index}>
                            <Button
                                variant={activeVariant}
                                text={step.label}
                                className={"border-solid border-sm border-neutral-muted"}
                                onClick={() => activateStep(index)}
                            />
                            {canDelete ? (
                                <Icon
                                    icon={<DeleteIcon />}
                                    label={"Delete step"}
                                    style={iconPosition}
                                    onClick={() => deleteStep(step.elementId)}
                                    className={iconClasses}
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>
            <Button variant={"ghost"} text={"+ Add step"} onClick={addStep} />
        </div>
    );
};
