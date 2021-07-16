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
import { useFieldEditor } from "./useFieldEditor";
import { FieldEditorProvider } from "./FieldEditorContext";
import { CmsEditorField, CmsEditorFieldsLayout } from "~/types";

const t = i18n.namespace("app-headless-cms/admin/components/editor");

const fieldTypes = ["field", "newField"];

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
        dropTarget
    } = useFieldEditor();

    return (
        <Fragment>
            {fields.length === 0 && (
                <Center
                    onDrop={item => onFieldDrop(item, { row: 0, index: 0 })}
                    style={{ padding: "5px 0 15px 0" }}
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
                                data-testid={`cms-editor-row-droppable-top-${index}`}
                                isVisible={noConflict()}
                                onDrop={item => onFieldDrop(item, { row: index, index: null })}
                            />
                            {/* Row start - includes field drop zones and fields */}
                            <Row>
                                {row.map((field, fieldIndex) => (
                                    <Draggable
                                        key={field.fieldId}
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
                                                    isVisible={noConflict(
                                                        item =>
                                                            fieldTypes.includes(item.type) &&
                                                            (row.length < 4 ||
                                                                get(item, "pos.row") === index)
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
                                                        isVisible={noConflict(
                                                            item =>
                                                                fieldTypes.includes(item.type) &&
                                                                (row.length < 4 ||
                                                                    get(item, "pos.row") === index)
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
                                ))}
                            </Row>
                            {/* Row end */}
                            {index === fields.length - 1 && (
                                <Horizontal
                                    data-testid={`cms-editor-row-droppable-bottom-${index}`}
                                    last
                                    isVisible={noConflict()}
                                    onDrop={item =>
                                        onFieldDrop(item, {
                                            row: index + 1,
                                            index: null
                                        })
                                    }
                                />
                            )}
                        </RowContainer>
                    )}
                </Draggable>
            ))}

            <EditFieldDialog
                field={field}
                onClose={editField}
                onSubmit={field => {
                    if (field.id) {
                        updateField(field);
                    } else {
                        insertField({ field, position: dropTarget });
                    }
                    editField(null);
                }}
            />
        </Fragment>
    );
};

export interface FieldEditorProps {
    parent?: CmsEditorField;
    layout: CmsEditorFieldsLayout;
    fields: CmsEditorField[];
    onChange: (params: { fields: CmsEditorField[]; layout: CmsEditorFieldsLayout }) => void;
}

export const FieldEditor = (props: FieldEditorProps) => {
    return (
        <FieldEditorProvider {...props}>
            <Editor />
        </FieldEditorProvider>
    );
};
