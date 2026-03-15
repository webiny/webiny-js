import React from "react";
import { Button, Icon } from "webiny/admin/ui";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/close.svg";
import {
    $updateElementInputs,
    createElement,
    useDocumentEditor
} from "webiny/admin/website-builder/page/editor";
import { useFunnel } from "./useFunnel.js";

const iconClasses =
    "absolute z-10 rounded-full bg-neutral-dimmed border-solid border-sm border-neutral-muted cursor-pointer fill-neutral-strong";

export const StepsNavigator = () => {
    const editor = useDocumentEditor();
    const funnel = useFunnel();

    if (!funnel) {
        return null;
    }

    const activateStep = (index: number) => {
        $updateElementInputs(editor, funnel.id, inputs => {
            inputs.activeStep = index;
        });
    };

    const deleteStep = (index: number) => {
        $updateElementInputs(editor, funnel.id, inputs => {
            const steps = inputs.steps ?? [];
            steps.splice(index, 1);
            inputs.steps = steps;
            inputs.activeStep = Math.max(0, index - 1);
        });
    };

    const addStep = () => {
        const steps = funnel.inputs.steps ?? [];
        const insertIndex = Math.max(steps.length - 1, 0);

        $updateElementInputs(editor, funnel.id, inputs => {
            const steps = inputs.steps ?? [];
            steps.splice(insertIndex, 0, {
                step: createElement({
                    component: "FunnelBuilder/Step",
                    inputs: { label: `Step ${steps.length}` }
                })
            });
            inputs.steps = steps;
            inputs.activeStep = insertIndex;
        });
    };

    return (
        <div className={"flex flex-row p-sm bg-neutral-light justify-between"}>
            <div className={"flex gap-md"}>
                {(funnel.inputs.steps ?? []).map((step, index) => {
                    const isFirstStep = index === 0;
                    const isLastStep = index === funnel.inputs.steps.length - 1;
                    const canDelete = !isFirstStep && !isLastStep;
                    return (
                        <div className={"relative"} key={index}>
                            <Button
                                variant={
                                    funnel.inputs.activeStep === index ? "primary" : "secondary"
                                }
                                text={step.step.label}
                                className={"border-solid border-sm border-neutral-muted"}
                                onClick={() => activateStep(index)}
                            />
                            {canDelete ? (
                                <Icon
                                    icon={<DeleteIcon />}
                                    label={"Delete step"}
                                    style={{
                                        top: -8,
                                        right: -8
                                    }}
                                    onClick={() => deleteStep(index)}
                                    className={iconClasses}
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>
            <Button variant={"primary"} text={"Add step"} onClick={addStep} />
        </div>
    );
};
