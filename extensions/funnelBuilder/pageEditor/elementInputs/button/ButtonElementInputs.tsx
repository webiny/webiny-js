import React from "react";
import { IconButton, Tooltip } from "webiny/admin/ui";
import { ElementInputs, useElementInputs } from "webiny/admin/website-builder/page/editor";
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
import { buttonActionsRegistry } from "./buttonActions/registry.js";
import { getRandomId } from "../../../utils/getRandomId.js";
import type { ButtonActionDto, ButtonInputs } from "./types";

/* Single sortable action row. */
interface ActionListItemProps {
    action: ButtonActionDto;
    onDelete: (actionId: string) => void;
}

const ActionListItem = ({ action, onDelete }: ActionListItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: action.id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    const definition = buttonActionsRegistry.find(def => def.type === action.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={
                "flex items-center justify-between border-b border-solid border-neutral-muted bg-neutral-base px-sm py-xs last:border-none hover:bg-neutral-dimmed"
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
                <span className={"text-sm"}>{definition?.name ?? action.type}</span>
            </div>
            <IconButton
                icon={<DeleteIcon />}
                variant={"ghost"}
                onClick={() => onDelete(action.id)}
            />
        </div>
    );
};

export const ButtonElementInputsDecorator = ElementInputs.createDecorator(Original => {
    return function ButtonElementSettings(props) {
        const { element } = props;
        const { inputs, updateInputs } = useElementInputs<ButtonInputs>(element.id);

        const sensors = useSensors(
            useSensor(PointerSensor),
            useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates
            })
        );

        if (element.component.name !== "Fub/Button") {
            return <Original {...props} />;
        }

        const actions: ButtonActionDto[] = inputs.buttonData?.actions ?? [];

        const addAction = (type: string) => {
            const definition = buttonActionsRegistry.find(def => def.type === type);
            if (!definition) {
                return;
            }

            const newAction: ButtonActionDto = {
                id: getRandomId(),
                type: definition.type,
                extra: definition.extra ?? {}
            };

            updateInputs(current => {
                const buttonInputs = current as unknown as ButtonInputs;
                if (definition.updateButtonLabel) {
                    buttonInputs.buttonData.label = definition.updateButtonLabel;
                }
                buttonInputs.buttonData.actions = [
                    ...(buttonInputs.buttonData.actions ?? []),
                    newAction
                ];
            });
        };

        const deleteAction = (actionId: string) => {
            updateInputs(current => {
                const buttonInputs = current as unknown as ButtonInputs;
                buttonInputs.buttonData.actions = buttonInputs.buttonData.actions.filter(
                    a => a.id !== actionId
                );
            });
        };

        const onDragEnd = (event: DragEndEvent) => {
            const { active, over } = event;
            if (active.id === over?.id) {
                return;
            }

            const oldIndex = actions.findIndex(a => a.id === active.id);
            const newIndex = actions.findIndex(a => a.id === over?.id);

            updateInputs(current => {
                (current as unknown as ButtonInputs).buttonData.actions = arrayMove(
                    actions,
                    oldIndex,
                    newIndex
                );
            });
        };

        /* Actions available to add — filtered by canAdd rules. */
        const availableActions = buttonActionsRegistry.filter(def => {
            return !def.canAdd || def.canAdd({ actions });
        });

        return (
            <div className={"flex flex-col gap-xl"}>
                <div className={"flex flex-col gap-sm"}>
                    <div className={"font-bold text-sm text-neutral-primary"}>Actions</div>

                    {actions.length > 0 ? (
                        <div className={"rounded border border-solid border-neutral-muted"}>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={onDragEnd}
                            >
                                <SortableContext
                                    items={actions}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {actions.map(action => (
                                        <ActionListItem
                                            key={action.id}
                                            action={action}
                                            onDelete={deleteAction}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    ) : (
                        <div className={"py-md text-center text-sm text-neutral-secondary"}>
                            No actions added yet.
                        </div>
                    )}

                    {availableActions.length > 0 && (
                        <div className={"flex flex-col gap-xs"}>
                            <div className={"text-xs text-neutral-secondary"}>Add action</div>
                            <div className={"flex flex-col gap-xs"}>
                                {availableActions.map(def => (
                                    <button
                                        key={def.type}
                                        type={"button"}
                                        className={
                                            "w-full rounded border border-solid border-neutral-muted bg-neutral-base px-sm py-xs text-left text-sm hover:bg-neutral-dimmed"
                                        }
                                        onClick={() => addAction(def.type)}
                                    >
                                        <div className={"font-medium"}>{def.name}</div>
                                        {def.description && (
                                            <div className={"text-xs text-neutral-secondary"}>
                                                {def.description}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };
});
