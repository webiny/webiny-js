import React from "react";
import { Button, Icon } from "webiny/admin/ui";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/close.svg";
import {
    useCreateElement,
    useDeleteElement,
    useUpdateElement
} from "webiny/admin/website-builder/page/editor";
import { useContainer } from "../useContainer.js";
import { type FunnelContainerInputs } from "../types.js";

const iconClasses =
    "absolute z-10 rounded-full bg-neutral-dimmed border-solid border-sm border-neutral-muted cursor-pointer fill-neutral-strong";

const iconPosition = {
    top: -8,
    right: -8
};

export const StepsNavigator = () => {
    const funnel = useContainer();
    const { createElement } = useCreateElement();
    const { updateElement } = useUpdateElement();
    const { deleteElement } = useDeleteElement();

    if (!funnel) {
        return null;
    }

    const { activeStep, steps = [] } = funnel.inputs;

    const activateStep = (index: number) => {
        funnel.updateInputs(inputs => {
            inputs.activeStep = index;
        });
    };

    const deleteStep = (stepElementId: string) => {
        deleteElement(stepElementId);
    };

    const addStep = () => {
        const steps = funnel.inputs.steps ?? [];
        const insertIndex = Math.max(steps.length - 1, 0);

        createElement({
            componentName: "Fub/Step",
            parentId: funnel.id,
            slot: "steps",
            index: insertIndex,
            bindings: {
                inputs: {
                    label: `Step ${steps.length}`
                }
            }
        });

        updateElement<FunnelContainerInputs>(funnel.id, inputs => {
            inputs.activeStep = insertIndex;
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
