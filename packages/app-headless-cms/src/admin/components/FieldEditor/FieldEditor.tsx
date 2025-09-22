import React, { Fragment } from "react";
import get from "lodash/get.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { ReactComponent as DragIcon } from "@webiny/icons/drag_indicator.svg";
import { Center, Vertical, Horizontal } from "../DropZone/index.js";
import Draggable from "../Draggable.js";
import EditFieldDialog from "./EditFieldDialog.js";
import Field from "./Field.js";
import { useModelFieldEditor } from "./useModelFieldEditor.js";
import type { IsVisibleCallable } from "./FieldEditorContext.js";
import { FieldEditorProvider } from "./FieldEditorContext.js";
import type {
    CmsModelField,
    CmsEditorFieldsLayout,
    CmsModelFieldTypePlugin,
    DragSource
} from "~/types.js";
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
        getFieldPlugin
    } = useModelFieldEditor();

    const canDropIntoField = (field: CmsModelField, draggable: DragSource) => {
        const fieldPlugin = getFieldPlugin(field.type) as CmsModelFieldTypePlugin;
        const canAccept = fieldPlugin.field.canAccept;
        if (typeof canAccept === "function" && !canAccept(field, draggable)) {
            return false;
        }

        return true;
    };

    const isVerticalDropzoneVisible = (cb: IsVisibleCallable) => {
        return (item: DragSource) => {
            if (!parent) {
                return cb(item);
            }

            const fieldPlugin = getFieldPlugin(parent.type) as CmsModelFieldTypePlugin;
            const allowLayout = fieldPlugin.field.allowLayout ?? true;
            if (!allowLayout) {
                return false;
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

            {fields.map((row, index) => (
                <Draggable
                    beginDrag={{
                        parent: parent ? parent.fieldId : null,
                        type: "row",
                        fields: row,
                        pos: { row: index }
                    }}
                    endDrag={onEndDrag}
                    key={row.map(f => f.fieldId).join(".")}
                >
                    {(
                        {
                            drag,
                            isDragging
                        } /* RowContainer start - includes drag handle, drop zones and the Row itself. */
                    ) => (
                        <div
                            className={cn([
                                "wby-flex wby-flex-column",
                                "wby-relative",
                                "wby-mb-md last-of-type:wby-mb-none",
                                "wby-bg-neutral-dimmed",
                                isDragging ? "wby-opacity-30" : "wby-opacity-100"
                            ])}
                        >
                            <div
                                className={cn([
                                    "wby-cursor-grab",
                                    "wby-absolute wby-left-sm-plus wby-top-sm-plus wby-z-10"
                                ])}
                                ref={drag}
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
                                    "wby-w-full wby-flex wby-justify-between",
                                    "wby-pl-xl wby-pr-sm wby-py-sm"
                                ])}
                                data-testid={"cms.editor.field-row"}
                            >
                                {row.map((field, fieldIndex) => (
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
                                                        "wby-relative",
                                                        "wby-flex-1 wby-basis-full",
                                                        "wby-mx-sm"
                                                    ])}
                                                    ref={drag}
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
                                                                        get(item, "pos.row") ===
                                                                            index)
                                                            )
                                                        )}
                                                    />

                                                    <div
                                                        className={
                                                            "wby-cursor-grab wby-bg-neutral-base wby-p-md wby-shadow-sm wby-rounded-xs"
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
                                                                            get(item, "pos.row") ===
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
                                ))}
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
            ))}

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
