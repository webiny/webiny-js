import React, { Fragment } from "react";
import get from "lodash/get";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as HandleIcon } from "~/admin/icons/round-drag_indicator-24px.svg";
import { Center, Vertical, Horizontal } from "../DropZone";
import Draggable from "../Draggable";
import EditFieldDialog from "./EditFieldDialog";
import Field from "./Field";
import { rowHandle, fieldHandle, fieldContainer, Row, RowContainer } from "./Styled";
import { useModelFieldEditor } from "./useModelFieldEditor";
import { FieldEditorProvider, IsVisibleCallable } from "./FieldEditorContext";
import { CmsModelField, CmsEditorFieldsLayout, CmsModelFieldTypePlugin, DragSource } from "~/types";
import { ModelFieldProvider } from "~/admin/components/ModelFieldProvider";

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
                        <RowContainer style={{ opacity: isDragging ? 0.3 : 1 }}>
                            <div className={rowHandle} ref={drag}>
                                <Icon icon={<HandleIcon />} />
                            </div>
                            <Horizontal
                                isVisible={isHorizontalDropzoneVisible(noConflict())}
                                data-testid={`cms-editor-row-droppable-top-${index}`}
                                onDrop={item => onFieldDrop(item, { row: index, index: null })}
                            />
                            {/* Row start - includes field drop zones and fields */}
                            <Row data-testid={"cms.editor.field-row"}>
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
                                                <div className={fieldContainer} ref={drag}>
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

                                                    <div className={fieldHandle}>
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
                            </Row>
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
                        </RowContainer>
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
