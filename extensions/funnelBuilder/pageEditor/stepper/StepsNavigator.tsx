import React, { useState } from "react";
import { Button, Icon } from "webiny/admin/ui";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/close.svg";
import {
    useCreateElement,
    useDeleteElement,
    useDocumentEditor,
    Commands
} from "webiny/admin/website-builder/page/editor";
import { useContainer } from "../useContainer.js";
import { FunnelStepModel } from "@/extensions/funnelBuilder/models/FunnelStepModel";

const iconClasses =
    "absolute z-10 rounded-full bg-neutral-dimmed border-solid border-sm border-neutral-muted cursor-pointer fill-neutral-strong";

const iconPosition = {
    top: -8,
    right: -8
};

export const Stepper = () => {
    const container = useContainer();

    const editor = useDocumentEditor();
    const { createElement } = useCreateElement();
    const { deleteElement } = useDeleteElement();
    const [activeStepId, setActiveStepId] = useState<string | null>(null);

    if (!container) {
        return null;
    }

    if (!container.inputs.containerData) {
        return null;
    }

    const steps = container.inputs.containerData.steps ?? [];
    // Slot steps carry the editor element IDs needed for deletion.
    const slotSteps = container.inputs.steps ?? [];

    const activateStep = (stepId: string) => {
        setActiveStepId(stepId);
        editor.executeCommand(Commands.SendPreviewMessage, {
            type: "fub.activeStepChanged",
            payload: { stepId }
        });
    };

    const deleteStep = (stepElementId: string) => {
        deleteElement(stepElementId);
    };

    const addStep = () => {
        const insertIndex = Math.max(steps.length - 1, 0);
        const newStep = new FunnelStepModel();

        createElement({
            componentName: "Fub/Step",
            parentId: container.id,
            slot: "steps",
            index: insertIndex,
            bindings: {
                inputs: {
                    stepData: newStep.toDto()
                }
            }
        });

        setTimeout(() => {
            setActiveStepId(newStep.id);
            editor.executeCommand(Commands.SendPreviewMessage, {
                type: "fub.activeStepChanged",
                payload: { stepId: newStep.id }
            });
        }, 10);
    };

    return (
        <div
            className={"flex flex-row p-sm bg-neutral-light justify-between"}
            data-affects-preview={"height"}
        >
            <div className={"flex gap-md"}>
                {steps.map((step, index) => {
                    const isFirstStep = index === 0;
                    const isLastStep = index === steps.length - 1;
                    const canDelete = !isFirstStep && !isLastStep;
                    const activeVariant = activeStepId === step.id ? "primary" : "secondary";
                    const elementId = slotSteps[index]?.elementId;

                    return (
                        <div className={"relative"} key={step.id}>
                            <Button
                                variant={activeVariant}
                                text={step.title}
                                className={"border-solid border-sm border-neutral-muted"}
                                onClick={() => activateStep(step.id)}
                            />
                            {canDelete && elementId ? (
                                <Icon
                                    icon={<DeleteIcon />}
                                    label={"Delete step"}
                                    style={iconPosition}
                                    onClick={() => deleteStep(elementId)}
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
