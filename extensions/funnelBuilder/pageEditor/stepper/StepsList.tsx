import React, { useState } from "react";
import { IconButton, Input, Tooltip } from "webiny/admin/ui";
import {
    useDeleteElement,
    useDocumentEditor,
    Commands
} from "webiny/admin/website-builder/page/editor";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    closestCenter,
    DragEndEvent
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove
} from "@dnd-kit/sortable";
import { ReactComponent as DeleteIcon } from "webiny/admin/icons/delete.svg";
import { ReactComponent as DragIndicator } from "webiny/admin/icons/drag_indicator.svg";
import { ReactComponent as EditIcon } from "webiny/admin/icons/edit.svg";
import { useContainer } from "../useContainer.js";
import type { FunnelStepModelDto } from "../../models/FunnelStepModel";
import type { FunnelContainerInputs } from "../types";

/* Single sortable step row. */
interface StepsListItemProps {
    step: FunnelStepModelDto;
    canDelete: boolean;
    elementId: string | undefined;
    onRename: (stepId: string, title: string) => void;
}

const StepsListItem = ({ step, canDelete, elementId, onRename }: StepsListItemProps) => {
    const { deleteElement } = useDeleteElement();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(step.title);

    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: step.id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    const commitRename = () => {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== step.title) {
            onRename(step.id, trimmed);
        } else {
            setDraft(step.title);
        }
        setEditing(false);
    };

    const startEditing = () => {
        setDraft(step.title);
        setEditing(true);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={
                "flex items-center justify-between border-b border-solid border-neutral-dimmed bg-neutral-base px-sm py-xs last:border-none hover:bg-neutral-dimmed"
            }
            {...attributes}
        >
            <div className={"flex flex-1 items-center gap-xs"}>
                <Tooltip
                    content={"Drag to reorder"}
                    trigger={
                        <span {...listeners} className={"cursor-grab"}>
                            <DragIndicator />
                        </span>
                    }
                />
                {editing ? (
                    <Input
                        autoFocus
                        value={draft}
                        onChange={setDraft}
                        onBlur={commitRename}
                        onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === "Enter") {
                                commitRename();
                            } else if (e.key === "Escape") {
                                setDraft(step.title);
                                setEditing(false);
                            }
                        }}
                    />
                ) : (
                    <span className={"flex-1 text-sm"}>{step.title}</span>
                )}
            </div>
            <div className={"flex items-center"}>
                {!editing && (
                    <IconButton icon={<EditIcon />} variant={"ghost"} onClick={startEditing} />
                )}
                {canDelete && elementId ? (
                    <IconButton
                        icon={<DeleteIcon />}
                        variant={"ghost"}
                        onClick={() => deleteElement(elementId)}
                    />
                ) : null}
            </div>
        </div>
    );
};

/* Drag-and-drop list of funnel steps shown in the sidebar. */
export const StepsList = () => {
    const container = useContainer();
    const editor = useDocumentEditor();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    if (!container || !container.inputs.containerData) {
        return null;
    }

    const steps = container.inputs.containerData.steps ?? [];
    const slotSteps = container.inputs.steps ?? [];

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id === over?.id) {
            return;
        }

        const oldIndex = steps.findIndex(s => s.id === active.id);
        const newIndex = steps.findIndex(s => s.id === over?.id);

        const reordered = arrayMove(steps, oldIndex, newIndex);

        container.updateInputs(current => {
            (current as unknown as FunnelContainerInputs).containerData.steps = reordered;
        });

        /* Notify the preview so it can re-sync step order. */
        editor.executeCommand(Commands.SendPreviewMessage, {
            type: "fub.stepsReordered",
            payload: { steps: reordered }
        });
    };

    const onRename = (stepId: string, title: string) => {
        container.updateInputs(current => {
            const inputs = current as unknown as FunnelContainerInputs;
            const step = inputs.containerData.steps.find(s => s.id === stepId);
            if (step) {
                step.title = title;
            }
        });
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={steps} strategy={verticalListSortingStrategy}>
                {steps.map((step, index) => {
                    const isFirstStep = index === 0;
                    const isLastStep = index === steps.length - 1;
                    const canDelete = !isFirstStep && !isLastStep;
                    const elementId = slotSteps[index]?.elementId;

                    return (
                        <StepsListItem
                            key={step.id}
                            step={step}
                            canDelete={canDelete}
                            elementId={elementId}
                            onRename={onRename}
                        />
                    );
                })}
            </SortableContext>
        </DndContext>
    );
};
