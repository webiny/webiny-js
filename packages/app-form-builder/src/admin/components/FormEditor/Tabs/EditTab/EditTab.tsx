import React, { useCallback, useState } from "react";
import { Icon } from "@webiny/ui/Icon";
import { cloneDeep } from "lodash";
import { Center, Vertical, Horizontal } from "../../DropZone";
import Draggable from "../../Draggable";
import EditFieldDialog from "./EditFieldDialog";
import Field from "./Field";
import { ReactComponent as HandleIcon } from "../../../../icons/round-drag_indicator-24px.svg";
import { rowHandle, EditContainer, fieldHandle, fieldContainer, Row, RowContainer } from "./Styled";
import { useFormEditor } from "../../Context";
import { FbFormModelField, FieldLayoutPositionType } from "~/types";
import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormsApp.Editor.EditTab");

export const EditTab: React.FC = () => {
    const {
        getLayoutFields,
        insertField,
        updateField,
        deleteField,
        data,
        moveField,
        moveRow,
        getFieldPlugin
    } = useFormEditor();
    const [editingField, setEditingField] = useState<FbFormModelField>(null);
    const [dropTarget, setDropTarget] = useState<FieldLayoutPositionType>(null);

    const editField = useCallback((field: FbFormModelField) => {
        setEditingField(cloneDeep(field));
    }, undefined);

    const handleDropField = useCallback(
        (source, dropTarget: FieldLayoutPositionType): undefined => {
            const { pos, name, ui } = source;

            if (name === "custom") {
                /**
                 * We can cast because field is empty in the start
                 */
                editField({} as FbFormModelField);
                setDropTarget(dropTarget);
                return undefined;
            }

            if (ui === "row") {
                // Reorder rows.
                // Reorder logic is different depending on the source and target position.
                moveRow(pos.row, dropTarget.row);
                return undefined;
            }

            // If source pos is set, we are moving an existing field.
            if (pos) {
                const fieldId = data.layout[pos.row][pos.index];
                moveField({ field: fieldId, position: dropTarget });
                return undefined;
            }

            // Find field plugin which handles the dropped field type "name".
            const plugin = getFieldPlugin({ name });
            insertField(plugin.field.createField(), dropTarget);
            return undefined;
        },
        undefined
    );

    const fields = getLayoutFields();

    return (
        <EditContainer>
            {fields.length === 0 && (
                <Center
                    onDrop={item => {
                        return handleDropField(item, { row: 0, index: 0 });
                    }}
                >
                    {t`Drop your first field here`}
                </Center>
            )}

            {fields.map((row, index) => (
                <Draggable beginDrag={{ ui: "row", pos: { row: index } }} key={index}>
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
                                onDrop={item => {
                                    return handleDropField(item, { row: index, index: null });
                                }}
                            />
                            {/* Row start - includes field drop zones and fields */}
                            <Row>
                                {row.map((field, fieldIndex) => (
                                    <Draggable
                                        key={fieldIndex}
                                        beginDrag={{
                                            ui: "field",
                                            name: field.name,
                                            pos: {
                                                row: index,
                                                index: fieldIndex
                                            }
                                        }}
                                    >
                                        {({ drag }) => (
                                            <div className={fieldContainer} ref={drag}>
                                                <Vertical
                                                    onDrop={item => {
                                                        return handleDropField(item, {
                                                            row: index,
                                                            index: fieldIndex
                                                        });
                                                    }}
                                                    isVisible={item =>
                                                        item.ui === "field" &&
                                                        (row.length < 4 || item?.pos?.row === index)
                                                    }
                                                />

                                                <div className={fieldHandle}>
                                                    <Field
                                                        field={field}
                                                        onEdit={editField}
                                                        onDelete={deleteField}
                                                    />
                                                </div>

                                                {/* Field end */}
                                                {fieldIndex === row.length - 1 && (
                                                    <Vertical
                                                        last
                                                        isVisible={item =>
                                                            item.ui === "field" &&
                                                            (row.length < 4 ||
                                                                item?.pos?.row === index)
                                                        }
                                                        onDrop={item => {
                                                            return handleDropField(item, {
                                                                row: index,
                                                                index: fieldIndex + 1
                                                            });
                                                        }}
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
                                    last
                                    onDrop={item => {
                                        return handleDropField(item, {
                                            row: index + 1,
                                            index: null
                                        });
                                    }}
                                />
                            )}
                        </RowContainer>
                    )}
                </Draggable>
            ))}

            <EditFieldDialog
                field={editingField}
                onClose={editField}
                onSubmit={(data: FbFormModelField) => {
                    if (data._id) {
                        updateField(data);
                    } else {
                        insertField(data, dropTarget);
                    }
                    editField(null);
                }}
            />
        </EditContainer>
    );
};
