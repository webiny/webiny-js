import React, { Fragment } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { ReactComponent as DragIcon } from "@webiny/icons/drag_indicator.svg";
import { Center, Horizontal, Vertical } from "../DropZone/index.js";
import Draggable from "../Draggable.js";
import EditFieldDialog from "./EditFieldDialog.js";
import Field from "./Field.js";
import { LayoutCell } from "./LayoutCell.js";
import { useModelFieldEditor } from "./useModelFieldEditor.js";
import type { IsVisibleCallable } from "./FieldEditorContext.js";
import { FieldEditorProvider } from "./FieldEditorContext.js";
import type { CmsEditorFieldsLayout, CmsModelField, DragSource } from "~/types.js";
import type { CmsLayoutField } from "@webiny/app-headless-cms-common/types/model.js";
import { isLayoutField } from "@webiny/app-headless-cms-common/types/model.js";
import { ModelFieldProvider } from "~/admin/components/ModelFieldProvider/index.js";
import { cn, Icon } from "@webiny/admin-ui";

const t = i18n.namespace("app-headless-cms/admin/components/editor");

const fieldTypes: string[] = ["field", "newField"];

const Editor = () => {
    const {
        parent,
        depth,
        insertField,
        updateField,
        deleteField,
        fields,
        noConflict,
        editField,
        onFieldDrop,
        onEndDrag,
        field,
        dropTarget,
        getFieldPlugin,
        getLayoutFieldPlugin,
        getField
    } = useModelFieldEditor();

    /**
     * Collect all data fields referenced inside a layout descriptor (e.g. fields inside tabs).
     * Delegates to the layout field plugin's `collectFields` method if available.
     */
    const collectLayoutFieldFields = (layoutField: CmsLayoutField): CmsModelField[] => {
        const plugin = getLayoutFieldPlugin(layoutField.type);
        if (!plugin?.field.collectFields) {
            return [];
        }
        return plugin.field.collectFields({
            field: layoutField,
            getField: (id: string) => getField({ id })
        });
    };

    const canDropIntoField = (field: CmsModelField, draggable: DragSource) => {
        const fieldPlugin = getFieldPlugin(field.type);
        if (!fieldPlugin) {
            return true;
        }
        const canAccept = fieldPlugin.field.canAccept;
        if (typeof canAccept === "function" && !canAccept(field, draggable)) {
            return false;
        }

        return true;
    };

    const isVerticalDropzoneVisible = (cb: IsVisibleCallable) => {
        return (item: DragSource) => {
            // Layout fields always occupy full row — no side-by-side layout
            if (item.type === "newLayoutField" || item.type === "layoutField") {
                return false;
            }

            if (!parent) {
                return cb(item);
            }

            const fieldPlugin = getFieldPlugin(parent.type);
            if (fieldPlugin) {
                const allowLayout = fieldPlugin.field.allowLayout ?? true;
                if (!allowLayout) {
                    return false;
                }
            }

            if (!canDropIntoField(parent, item)) {
                return false;
            }

            return cb(item);
        };
    };

    const isHorizontalDropzoneVisible = (cb: IsVisibleCallable) => {
        return (item: DragSource) => {
            if (!parent) {
                return cb(item);
            }

            if (!canDropIntoField(parent, item)) {
                return false;
            }

            return cb(item);
        };
    };

    return (
        <Fragment>
            {fields.length === 0 && (
                <Center
                    isDroppable={isHorizontalDropzoneVisible(() => true)}
                    onDrop={item =>
                        onFieldDrop(item, {
                            row: 0,
                            index: 0
                        })
                    }
                >
                    {t`Drop your first field here`}
                </Center>
            )}

            {fields.map((row, index) => {
                // Build a stable key for the row
                const rowKey = row
                    .map(cell => (isLayoutField(cell) ? cell.id : (cell as CmsModelField).fieldId))
                    .join(".");

                return (
                    <Draggable
                        beginDrag={{
                            parent: parent ? parent.fieldId : null,
                            type: "row",
                            fields: row.filter(cell => !isLayoutField(cell)) as CmsModelField[],
                            pos: { row: index }
                        }}
                        endDrag={onEndDrag}
                        key={rowKey}
                    >
                        {(
                            {
                                drag,
                                isDragging
                            } /* RowContainer start - includes drag handle, drop zones and the Row itself. */
                        ) => (
                            <div
                                className={cn([
                                    "flex flex-column",
                                    "relative",
                                    "mb-md last-of-type:mb-none",
                                    "bg-neutral-dimmed",
                                    isDragging ? "opacity-30" : "opacity-100"
                                ])}
                            >
                                <div
                                    className={cn([
                                        "cursor-grab",
                                        "absolute left-sm-plus top-sm-plus z-10"
                                    ])}
                                    ref={element => {
                                        drag(element);
                                    }}
                                >
                                    <Icon
                                        icon={<DragIcon />}
                                        label={"Drag to move this row"}
                                        color={"neutral-light"}
                                        size={"sm"}
                                    />
                                </div>
                                <Horizontal
                                    isVisible={isHorizontalDropzoneVisible(noConflict())}
                                    data-testid={`cms-editor-row-droppable-top-${index}`}
                                    onDrop={item => onFieldDrop(item, { row: index, index: null })}
                                />
                                {/* Row start - includes field drop zones and fields */}
                                <div
                                    className={cn([
                                        "w-full flex justify-between",
                                        "pl-xl pr-sm py-sm"
                                    ])}
                                    data-testid={"cms.editor.field-row"}
                                >
                                    {row.map((cell, fieldIndex) => {
                                        if (isLayoutField(cell)) {
                                            return (
                                                <Draggable
                                                    key={cell.id}
                                                    beginDrag={{
                                                        parent: parent ? parent.fieldId : null,
                                                        type: "layoutField",
                                                        layoutField: cell,
                                                        fields: collectLayoutFieldFields(cell)
                                                    }}
                                                    endDrag={onEndDrag}
                                                >
                                                    {({ drag }) => (
                                                        <div
                                                            ref={element => {
                                                                drag(element);
                                                            }}
                                                            className={cn([
                                                                "relative",
                                                                "flex-1 basis-full",
                                                                "mx-sm"
                                                            ])}
                                                        >
                                                            <div
                                                                className={
                                                                    "cursor-grab bg-neutral-base p-md shadow-sm rounded-xs"
                                                                }
                                                            >
                                                                <LayoutCell
                                                                    field={cell}
                                                                    rowIndex={index}
                                                                    cellIndex={fieldIndex}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        }

                                        const field = cell as CmsModelField;
                                        return (
                                            <ModelFieldProvider field={field} key={field.fieldId}>
                                                <Draggable
                                                    beginDrag={{
                                                        parent: parent ? parent.fieldId : null,
                                                        type: "field",
                                                        field,
                                                        pos: {
                                                            row: index,
                                                            index: fieldIndex
                                                        }
                                                    }}
                                                    endDrag={onEndDrag}
                                                >
                                                    {({ drag }) => (
                                                        <div
                                                            className={cn([
                                                                "relative",
                                                                "flex-1 basis-full",
                                                                "mx-sm"
                                                            ])}
                                                            ref={element => {
                                                                drag(element);
                                                            }}
                                                        >
                                                            <Vertical
                                                                depth={depth}
                                                                onDrop={item =>
                                                                    onFieldDrop(item, {
                                                                        row: index,
                                                                        index: fieldIndex
                                                                    })
                                                                }
                                                                isVisible={isVerticalDropzoneVisible(
                                                                    noConflict(
                                                                        item =>
                                                                            fieldTypes.includes(
                                                                                item.type
                                                                            ) &&
                                                                            (row.length < 4 ||
                                                                                item.pos?.row ===
                                                                                    index)
                                                                    )
                                                                )}
                                                            />

                                                            <div
                                                                className={
                                                                    "cursor-grab bg-neutral-base p-md shadow-sm rounded-xs"
                                                                }
                                                            >
                                                                <Field
                                                                    parent={parent}
                                                                    field={field}
                                                                    onEdit={editField}
                                                                    onDelete={deleteField}
                                                                />
                                                            </div>

                                                            {/* Field end */}
                                                            {fieldIndex === row.length - 1 && (
                                                                <Vertical
                                                                    last
                                                                    depth={depth}
                                                                    isVisible={isVerticalDropzoneVisible(
                                                                        noConflict(item => {
                                                                            return (
                                                                                fieldTypes.includes(
                                                                                    item.type
                                                                                ) &&
                                                                                (row.length < 4 ||
                                                                                    item.pos
                                                                                        ?.row ===
                                                                                        index)
                                                                            );
                                                                        })
                                                                    )}
                                                                    onDrop={item =>
                                                                        onFieldDrop(item, {
                                                                            row: index,
                                                                            index: fieldIndex + 1
                                                                        })
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            </ModelFieldProvider>
                                        );
                                    })}
                                </div>
                                {/* Row end */}
                                {index === fields.length - 1 ? (
                                    <Horizontal
                                        data-testid={`cms-editor-row-droppable-bottom-${index}`}
                                        last
                                        isVisible={isHorizontalDropzoneVisible(noConflict())}
                                        onDrop={item =>
                                            onFieldDrop(item, {
                                                row: index + 1,
                                                index: null
                                            })
                                        }
                                    />
                                ) : null}
                            </div>
                        )}
                    </Draggable>
                );
            })}

            {field ? (
                <ModelFieldProvider field={field}>
                    <EditFieldDialog
                        onClose={() => editField(null)}
                        onSubmit={field => {
                            if (field.id) {
                                updateField(field);
                                editField(null);
                                return;
                            }
                            insertField({ field, position: dropTarget });

                            editField(null);
                        }}
                    />
                </ModelFieldProvider>
            ) : null}
        </Fragment>
    );
};

export interface FieldEditorProps {
    parent?: CmsModelField;
    layout: CmsEditorFieldsLayout;
    fields: CmsModelField[];
    onChange: (params: { fields: CmsModelField[]; layout: CmsEditorFieldsLayout }) => void;
}

export const FieldEditor = (props: FieldEditorProps) => {
    return (
        <FieldEditorProvider {...props}>
            <Editor />
        </FieldEditorProvider>
    );
};
