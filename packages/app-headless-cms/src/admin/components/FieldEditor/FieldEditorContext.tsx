import React, { useCallback, useState } from "react";
import dot from "dot-prop-immutable";
import shortid from "shortid";
import cloneDeep from "lodash/cloneDeep";
import useDeepCompareEffect from "use-deep-compare-effect";
import {
    CmsEditorField,
    CmsEditorFieldId,
    CmsEditorFieldsLayout,
    CmsEditorFieldTypePlugin,
    FieldLayoutPosition
} from "~/types";
import { plugins } from "@webiny/plugins";
import * as utils from "./utils";
import { FieldEditorProps } from "./FieldEditor";
import { DragObjectWithType, DragSourceMonitor } from "react-dnd";
import { useFieldEditor } from "~/admin/components/FieldEditor/useFieldEditor";

interface DropTarget {
    row: number;
    index: number;
}

interface Position {
    row: number;
    index: number;
}

export interface DragSource extends DragObjectWithType {
    parent?: string;
    pos: Partial<Position>;
    type: "row" | "field" | "newField";
    fieldType?: string;
    field?: CmsEditorField;
    fields?: CmsEditorField[];
}

export interface FieldEditorContextValue {
    fields: CmsEditorField[][];
    noConflict: Function;
    layout: CmsEditorFieldsLayout;
    onChange?: (data: any) => void;
    getFieldsInLayout: () => CmsEditorField[][];
    getFieldPlugin: (type: string) => CmsEditorFieldTypePlugin;
    getField: (query: Record<string, string>) => CmsEditorField;
    editField: (field: CmsEditorField) => void;
    field: CmsEditorField;
    parent: CmsEditorField;
    depth: number;
    dropTarget?: DropTarget;
    onFieldDrop: (source: Partial<DragSource>, target: DropTarget) => void;
    onEndDrag: (item: DragSource, monitor: DragSourceMonitor) => void;
    insertField: (params: { field: CmsEditorField; position: FieldLayoutPosition }) => void;
    moveField: (params: {
        field: CmsEditorFieldId | CmsEditorField;
        position: FieldLayoutPosition;
    }) => void;
    moveRow: (source: number, destination: number) => void;
    updateField: (field: CmsEditorField) => void;
    deleteField: (field: CmsEditorField) => void;
}

interface FieldEditorProviderProps extends FieldEditorProps {
    children: React.ReactElement;
}

export const FieldEditorContext = React.createContext<FieldEditorContextValue>(null);

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
        const editor = useFieldEditor();
        depth = editor.depth + 1;
    } catch {
        // There's no parent provider, so this is the top-level one.
    }

    const [state, setState] = useState({
        layout,
        fields,
        field: null,
        dropTarget: null
    });

    useDeepCompareEffect(() => {
        onChange({ fields: state.fields, layout: state.layout });
    }, [state.fields, state.layout]);

    const editField = useCallback(field => {
        setState(state => ({ ...state, field }));
    }, []);

    const onDropTarget = { dropTarget: parent ? parent.fieldId : null };

    const onFieldDrop = useCallback<FieldEditorContextValue["onFieldDrop"]>(
        (source, dropTarget) => {
            const { pos, type, fieldType, field, fields } = source;

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
                } else {
                    // We're dragging a row within the same fieldset
                    moveRow(pos.row, dropTarget.row);
                }

                return onDropTarget;
            }

            // If source pos is set, we are moving an existing field.
            if (pos) {
                if (parentId !== source.parent) {
                    // We're dragging an existing field from another fieldset
                    insertField({ field, position: dropTarget });
                } else {
                    // We're dragging a field within the same fieldset
                    moveField({ field, position: dropTarget });
                }
                return onDropTarget;
            }

            const plugin = getFieldPlugin(fieldType);
            editField(plugin.field.createField());
            setState(state => ({ ...state, dropTarget }));
        },
        []
    );

    const onEndDrag: FieldEditorContextValue["onEndDrag"] = ({ type, field, fields }, monitor) => {
        if (!monitor.didDrop()) {
            return;
        }

        // Check if we dropped outside of the source fieldset, and if yes, remove the field from the original parent.
        const { dropTarget } = monitor.getDropResult();
        const parentId = parent ? parent.fieldId : null;
        if (dropTarget === parentId) {
            return;
        }

        const removeFields = type === "row" ? fields : [field];
        removeFields.forEach(field => deleteField(field));
    };

    const getFieldsInLayout: FieldEditorContextValue["getFieldsInLayout"] = () => {
        // Replace every field ID with actual field object.
        const fields = cloneDeep(state.layout.filter(arr => arr.length));
        fields.forEach((row, rowIndex) => {
            row.forEach((fieldId, fieldIndex) => {
                fields[rowIndex][fieldIndex] = getField({ id: fieldId });
            });
        });
        return fields;
    };

    /**
     * Return field plugin.
     */
    const getFieldPlugin: FieldEditorContextValue["getFieldPlugin"] = type => {
        return plugins
            .byType<CmsEditorFieldTypePlugin>("cms-editor-field-type")
            .find(({ field }) => field.type === type);
    };

    /**
     * Checks if field of given type already exists in the list of fields.
     */
    const getField: FieldEditorContextValue["getField"] = query => {
        return state.fields.find(field => {
            for (const key in query) {
                if (!(key in field)) {
                    return null;
                }

                if (field[key] !== query[key]) {
                    return null;
                }
            }

            return true;
        });
    };

    /**
     * Inserts a new field into the target position.
     */
    const insertField: FieldEditorContextValue["insertField"] = ({ field, position }) => {
        if (!field.id) {
            field.id = shortid.generate();
        }

        if (!field.type) {
            throw new Error(`Field "type" missing.`);
        }

        const fieldPlugin = getFieldPlugin(field.type);
        if (!fieldPlugin) {
            throw new Error(`Invalid field "type".`);
        }

        setState(data => {
            data = dot.set(data, "fields", fields => {
                if (Array.isArray(fields)) {
                    return fields.concat(field);
                }
                return [field];
            });

            // Move field to position where it was dropped.
            return utils.moveField({ field, position, data });
        });
    };

    /**
     * Moves field to the given target position.
     */
    const moveField: FieldEditorContextValue["moveField"] = ({ field, position }) => {
        setState(data => {
            return utils.moveField({ field, position, data });
        });
    };

    /**
     * Moves row to a destination row.
     */
    const moveRow: FieldEditorContextValue["moveRow"] = (source, destination) => {
        setState(data => {
            return utils.moveRow({ data, source, destination });
        });
    };

    /**
     * Updates field.
     */
    const updateField: FieldEditorContextValue["updateField"] = field => {
        setState(data => {
            for (let i = 0; i < data.fields.length; i++) {
                if (data.fields[i].id === field.id) {
                    return dot.set(data, `fields.${i}`, field);
                }
            }
        });
    };

    /**
     * Deletes a field (both from the list of field and the layout).
     */
    const deleteField: FieldEditorContextValue["deleteField"] = field => {
        setState(data => {
            return utils.deleteField({ field, data });
        });
    };

    const noConflict = useCallback(
        isVisible => item => {
            const sameParent = item.parent === onDropTarget.dropTarget;
            const draggedFields = [];
            switch (item.type) {
                case "row":
                    item.fields.forEach(field => draggedFields.push(field.fieldId));
                    break;
                case "field":
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

    const value = {
        parent,
        depth,
        getFieldsInLayout,
        getFieldPlugin,
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
