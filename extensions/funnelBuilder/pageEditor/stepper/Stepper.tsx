import React, { useState, useEffect, useRef } from "react";
import { Button, Icon } from "webiny/admin/ui";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/close.svg";
import {
    useCreateElement,
    useDeleteElement,
    useDocumentEditor,
    $deselectElement,
    Commands
} from "webiny/admin/website-builder/page/editor";
import { useContainer } from "../useContainer.js";

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

    const steps = container?.inputs.containerData?.steps ?? [];
    const prevStepsRef = useRef(steps);

    /* Sync active step when steps are added, removed, or on initial mount. */
    useEffect(() => {
        const prevSteps = prevStepsRef.current;
        prevStepsRef.current = steps;

        if (steps.length > prevSteps.length) {
            // A step was added — activate the newly inserted step (second-to-last, just before success).
            const newStep = steps[steps.length - 2];
            if (newStep) {
                setActiveStepId(newStep.id);
                editor.executeCommand(Commands.SendPreviewMessage, {
                    type: "fub.activeStepChanged",
                    payload: { stepId: newStep.id }
                });
            }
        } else if (steps.length < prevSteps.length) {
            // A step was deleted — if it was the active one, fall back to the previous step.
            const activeStepExists = steps.some(s => s.id === activeStepId);
            if (!activeStepExists) {
                const prevActiveIndex = prevSteps.findIndex(s => s.id === activeStepId);
                const fallbackStep = steps[Math.max(0, prevActiveIndex - 1)] ?? steps[0];
                if (fallbackStep) {
                    setActiveStepId(fallbackStep.id);
                    editor.executeCommand(Commands.SendPreviewMessage, {
                        type: "fub.activeStepChanged",
                        payload: { stepId: fallbackStep.id }
                    });
                }
            }
        } else if (steps.length && !activeStepId) {
            // No active step yet (initial mount) — activate the first step.
            const firstStep = steps[0];
            setActiveStepId(firstStep.id);
            editor.executeCommand(Commands.SendPreviewMessage, {
                type: "fub.activeStepChanged",
                payload: { stepId: firstStep.id }
            });
        }
    }, [steps]);

    // Container might not be ready immediately.
    if (!container?.inputs.containerData) {
        return null;
    }

    // Slot steps carry the editor element IDs needed for deletion.
    const slotSteps = container.inputs.steps ?? [];

    const activateStep = (stepId: string) => {
        setActiveStepId(stepId);
        $deselectElement(editor);
        editor.executeCommand(Commands.SendPreviewMessage, {
            type: "fub.activeStepChanged",
            payload: { stepId }
        });
    };

    const deleteStep = (stepElementId: string) => {
        deleteElement(stepElementId);
    };

    const addStep = () => {
        createElement({
            componentName: "Fub/Step",
            parentId: container.id,
            slot: "steps",
            index: steps.length - 1
        });
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
                    const isSuccessStep = isLastStep;
                    const canDelete = !isFirstStep && !isSuccessStep;
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
            <Button variant={"primary"} text={"+ Add step"} onClick={addStep} />
        </div>
    );
};
