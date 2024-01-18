import React, { useCallback, useState } from "react";
import dot from "dot-prop-immutable";
import useDeepCompareEffect from "use-deep-compare-effect";
import {
    CmsEditorFieldId,
    CmsEditorFieldRendererPlugin,
    CmsEditorFieldsLayout,
    CmsEditorFieldTypePlugin,
    CmsModelField,
    DragSource,
    FieldLayoutPosition
} from "~/types";
import { plugins } from "@webiny/plugins";
import * as utils from "./utils";
import { FieldEditorProps } from "./FieldEditor";
import { DragSourceMonitor } from "react-dnd";
import { useModelFieldEditor } from "~/admin/components/FieldEditor/useModelFieldEditor";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";

interface DropTarget {
    row: number;
    index: number | null;
}

/**
 * Property in GetFieldParams can be any key from CmsEditorField, but TS does not allow union types
 */
interface GetFieldParams {
    id?: string;
    fieldId?: string;
}
interface InsertFieldParams {
    field: CmsModelField;
    position: FieldLayoutPosition;
}
interface MoveFieldParams {
    field: CmsEditorFieldId | CmsModelField;
    position: FieldLayoutPosition;
}
interface GetFieldsInLayoutCallable {
    (): CmsModelField[][];
}
interface GetFieldPluginCallable {
    (type: string): CmsEditorFieldTypePlugin | undefined;
}
interface GetFieldCallable {
    (query: GetFieldParams): CmsModelField | undefined;
}
interface GetFieldRendererCallable {
    (rendererName: string): CmsEditorFieldRendererPlugin | undefined;
}
interface OnFieldDropCallable {
    (source: Partial<DragSource>, target: DropTarget): void;
}
interface InsertFieldCallable {
    (params: InsertFieldParams): void;
}
interface MoveFieldCallable {
    (params: MoveFieldParams): void;
}
interface OnEndDragCallable<DragObject = unknown, DropResult = unknown> {
    (item: DragSource, monitor: DragSourceMonitor<DragObject, DropResult>): void;
}
interface MoveRowCallable {
    (source: number, destination: number): void;
}
interface UpdateFieldCallable {
    (field: CmsModelField): void;
}
interface DeleteFieldCallable {
    (field: Pick<CmsModelField, "id">): void;
}
export interface IsVisibleCallable {
    (item: DragSource): boolean;
}
interface NoConflictCallable {
    (cb?: IsVisibleCallable): (item: DragSource) => boolean;
}
export interface FieldEditorContext {
    fields: CmsModelField[][];
    noConflict: NoConflictCallable;
    layout: CmsEditorFieldsLayout;
    onChange?: (data: any) => void;
    getFieldsInLayout: GetFieldsInLayoutCallable;
    getFieldPlugin: GetFieldPluginCallable;
    getField: GetFieldCallable;
    getFieldRendererPlugin: GetFieldRendererCallable;
    editField: (field: CmsModelField | null) => void;
    field: CmsModelField | null;
    parent?: CmsModelField;
    depth: number;
    dropTarget: DropTarget;
    onFieldDrop: OnFieldDropCallable;
    onEndDrag: OnEndDragCallable;
    insertField: InsertFieldCallable;
    moveField: MoveFieldCallable;
    moveRow: MoveRowCallable;
    updateField: UpdateFieldCallable;
    deleteField: DeleteFieldCallable;
}

interface FieldEditorProviderProps extends FieldEditorProps {
    children: React.ReactElement;
}

type DropResult = {
    dropTarget: string | null;
};

export const FieldEditorContext = React.createContext<FieldEditorContext | undefined>(undefined);
/**
 * We try to generate the random id string but with the check that it does not exist already.
 * Chances that the same string exists are quite small, but let's check it anyway.
 *
 * In most cases, there will be no iterations anyway...
 */
const maxGenerateIdIterations = 100;
const generateFieldId = (layout: string[]): string => {
    let id = generateAlphaNumericLowerCaseId(8);

    let iteration = 0;
    while (layout.includes(id) && iteration < maxGenerateIdIterations) {
        id = generateAlphaNumericLowerCaseId(8);
        iteration++;
    }
    if (iteration >= maxGenerateIdIterations) {
        throw new Error(`Could not generate field ID in ${maxGenerateIdIterations} iterations.`);
    }
    return id;
};

interface State {
    layout: CmsEditorFieldsLayout;
    fields: CmsModelField[];
    field: CmsModelField | null;
    dropTarget: DropTarget;
}
export const FieldEditorProvider = ({
    parent,
    fields,
    layout,
    onChange,
    children
}: FieldEditorProviderProps) => {
    // We need to determine depth of this provider so we can render drop zones with correct z-indexes.
    let depth = 0;
    try {
        const editor = useModelFieldEditor();
        depth = editor.depth + 1;
    } catch {
        // There's no parent provider, so this is the top-level one.
    }

    const [state, setState] = useState<State>({
        layout,
        fields,
        field: null,
        dropTarget: {
            row: -1,
            index: null
        }
    });

    useDeepCompareEffect(() => {
        onChange({ fields: state.fields, layout: state.layout });
    }, [state.fields, state.layout]);

    const editField = useCallback((field: CmsModelField | null) => {
        setState(state => ({ ...state, field }));
    }, []);

    const onDropTarget = {
        dropTarget: parent ? parent.fieldId : null
    };

    const onFieldDrop = useCallback<OnFieldDropCallable>((source, dropTarget) => {
        const { pos, type, fieldType, field, fields = [] } = source;

        const parentId = parent ? parent.fieldId : null;

        if (type === "row") {
            if (parentId !== source.parent) {
                // We're dragging an existing row from another fieldset
                fields.forEach((field, index) => {
                    insertField({
                        field,
                        position: {
                            row: dropTarget.row,
                            index: index === 0 ? null : index
                        }
                    });
                });
            } else if (pos && pos.row !== undefined) {
                // We're dragging a row within the same fieldset
                moveRow(pos.row, dropTarget.row);
            }

            return onDropTarget;
        }

        // If source pos is set, we are moving an existing field.
        if (pos) {
            if (!field) {
                return onDropTarget;
            }
            if (parentId !== source.parent) {
                // We're dragging an existing field from another fieldset
                insertField({ field, position: dropTarget });
            } else {
                // We're dragging a field within the same fieldset
                moveField({ field, position: dropTarget });
            }
            return onDropTarget;
        }

        if (!fieldType) {
            return null;
        }
        const plugin = getFieldPlugin(fieldType);
        if (!plugin) {
            return null;
        }

        const fieldData = plugin.field.createField() as CmsModelField;

        if (plugin.field.canEditSettings !== false) {
            editField(fieldData);
            setState(state => ({
                ...state,
                dropTarget
            }));
        } else {
            insertField({ field: fieldData, position: dropTarget });
        }
        return null;
    }, []);

    const onEndDrag: OnEndDragCallable<unknown, DropResult> = (
        { type, field, fields },
        monitor
    ) => {
        if (!monitor.didDrop()) {
            return;
        }

        // Check if we dropped outside of the source fieldset, and if yes, remove the field from the original parent.
        const monitorResult = monitor.getDropResult();
        const parentId = parent ? parent.fieldId : null;
        if (monitorResult?.dropTarget === parentId) {
            return;
        }

        const removeFields = type === "row" ? fields || [] : field ? [field] : [];
        removeFields.forEach(field => deleteField(field));
    };

    const getFieldsInLayout: GetFieldsInLayoutCallable = () => {
        // Replace every field ID with actual field object.
        return state.layout
            .filter(arr => arr.length)
            .map(row => {
                return row
                    .map(id => {
                        return getField({ id });
                    })
                    .filter(Boolean);
            })
            .filter(row => {
                return row.length > 0;
            }) as CmsModelField[][];
    };

    /**
     * Return field plugin.
     */
    const getFieldPlugin: GetFieldPluginCallable = type => {
        return plugins
            .byType<CmsEditorFieldTypePlugin>("cms-editor-field-type")
            .find(plugin => plugin.field.type === type);
    };

    const getFieldRendererPlugin: GetFieldRendererCallable = name => {
        return plugins
            .byType<CmsEditorFieldRendererPlugin>("cms-editor-field-renderer")
            .find(plugin => plugin.renderer.rendererName === name);
    };

    /**
     * Checks if field of given type already exists in the list of fields.
     */
    const getField: GetFieldCallable = query => {
        return state.fields.find(field => {
            for (const key in query) {
                if (!(key in field)) {
                    return false;
                }

                if (field[key as keyof typeof field] !== query[key as keyof typeof query]) {
                    return false;
                }
            }

            return true;
        });
    };

    /**
     * Inserts a new field into the target position.
     */
    const insertField: InsertFieldCallable = ({ field, position }) => {
        if (!field.id) {
            field.id = generateFieldId(layout.flat());
        }

        if (!field.type) {
            throw new Error(`Field "type" missing.`);
        }

        const fieldPlugin = getFieldPlugin(field.type);
        if (!fieldPlugin) {
            throw new Error(`No plugin found for field type "${field.type}".`);
        }

        setState(prev => {
            const next: State = {
                ...prev,
                fields: (prev.fields || []).concat(field)
            };

            // Move field to position where it was dropped.
            return utils.moveField({ field, position, data: next });
        });
    };

    /**
     * Moves field to the given target position.
     */
    const moveField: MoveFieldCallable = ({ field, position }) => {
        setState(data => {
            return utils.moveField<State>({ field, position, data });
        });
    };

    /**
     * Moves row to a destination row.
     */
    const moveRow: MoveRowCallable = (source, destination) => {
        setState(data => {
            return utils.moveRow({ data, source, destination });
        });
    };

    /**
     * Updates field.
     */
    const updateField: UpdateFieldCallable = field => {
        setState(data => {
            for (let i = 0; i < data.fields.length; i++) {
                if (data.fields[i].id === field.id) {
                    return dot.set(data, `fields.${i}`, field);
                }
            }
            return data;
        });
    };

    /**
     * Deletes a field (both from the list of field and the layout).
     */
    const deleteField: DeleteFieldCallable = field => {
        setState(data => {
            return utils.deleteField({ field, data });
        });
    };

    const noConflict: NoConflictCallable = useCallback(
        (isVisible?: IsVisibleCallable) => item => {
            const sameParent = item.parent === onDropTarget.dropTarget;
            const draggedFields: string[] = [];
            switch (item.type) {
                case "row":
                    (item.fields || []).forEach(field => draggedFields.push(field.fieldId));
                    break;
                case "field":
                    if (!item.field) {
                        break;
                    }
                    draggedFields.push(item.field.fieldId);
                    break;
                default:
                    break;
            }

            if (
                draggedFields.length &&
                !sameParent &&
                fields.some(field => draggedFields.includes(field.fieldId))
            ) {
                return false;
            }

            return typeof isVisible === "function" ? isVisible(item) : true;
        },
        [fields.map(f => f.fieldId).join(".")]
    );

    const value: FieldEditorContext = {
        parent,
        depth,
        getFieldsInLayout,
        getFieldPlugin,
        getFieldRendererPlugin,
        getField,
        editField,
        field: state.field,
        dropTarget: state.dropTarget,
        onFieldDrop,
        onEndDrag,
        insertField,
        moveField,
        moveRow,
        updateField,
        deleteField,
        fields: getFieldsInLayout(),
        noConflict,
        layout: state.layout
    };

    return <FieldEditorContext.Provider value={value}>{children}</FieldEditorContext.Provider>;
};
