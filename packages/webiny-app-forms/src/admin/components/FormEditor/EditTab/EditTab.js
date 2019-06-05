import React from "react";
import { Elevation } from "webiny-ui/Elevation";
import { Icon } from "webiny-ui/Icon";
import { get } from "lodash";
import { Center, Vertical, Horizontal } from "../DropZone";
import Draggable from "../Draggable";
import EditFieldDialog from "./EditFieldDialog";
import Field from "./Field";
import { ReactComponent as HandleIcon } from "../icons/round-drag_indicator-24px.svg";
import { rowHandle, EditContainer, fieldHandle, FieldContainer, Row, RowContainer } from "./Styled";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormEditor.EditTab");

function onDrop(source, target) {
    console.log('onDropaaa')
    return;
    const { pos, type, ui } = source;
    const { row } = target;

    createAtRef.current = { ...target };

    if (type === "custom") {
        console.log("whatfcudk");
        return;
    }

    if (ui === "row") {
        // Reorder rows.
        // Reorder logic is different depending on the source and target position.
        setFormState(state => {
            return {
                ...state,
                fields:
                    pos.row < row
                        ? [
                              ...state.fields.slice(0, pos.row),
                              ...state.fields.slice(pos.row + 1, row),
                              state.fields[pos.row],
                              ...state.fields.slice(row)
                          ]
                        : [
                              ...state.fields.slice(0, row),
                              state.fields[pos.row],
                              ...state.fields.slice(row, pos.row),
                              ...state.fields.slice(pos.row + 1)
                          ]
            };
        });

        return;
    }

    // If source pos is set, we are moving an existing field.
    if (pos) {
        setFormState(state => {
            const fields = [...state.fields];
            const fieldData = { ...fields[pos.row][pos.index] };

            fields[pos.row].splice(pos.index, 1);

            if (fields[pos.row].length === 0) {
                fields.splice(pos.row, 1);
                if (pos.row < row) {
                    createAtRef.current.row--;
                }
            }

            return insertField(fieldData, createAtRef.current, { ...state, fields });
        });

        return;
    }

    // Find field plugin which handles the dropped field type "id".
    const plugin = getPlugins("form-editor-field-type").find(pl => pl.fieldType.id === type);
    const data = plugin.fieldType.createField();
    insertField(data, createAtRef.current);
}

export const EditTab = () => {
    const { state, getFields } = useFormEditor();

    const fields = getFields(true);
    return (
        <EditContainer>
            {fields.length === 0 && (
                <Center onDrop={item => onDrop(item, { row: 0, index: 0 })}>
                    {t`Drop your first field here`}
                </Center>
            )}

            {fields.map((row, index) => (
                <Draggable beginDrag={{ ui: "row", pos: { row: index } }} key={index}>
                    {({ connectDragSource, isDragging }) => (
                        /* RowContainer start - includes drag handle, drop zones and the Row itself. */
                        <RowContainer style={{ opacity: isDragging ? 0.3 : 1 }}>
                            <Elevation z={3}>
                                {connectDragSource(
                                    <div className={rowHandle}>
                                        <Icon icon={<HandleIcon />} />
                                    </div>
                                )}
                                <Horizontal
                                    onDrop={item => onDrop(item, { row: index, index: null })}
                                />
                                {/* Row start - includes field drop zones and fields */}
                                <Row>
                                    {row.map((field, fieldIndex) => (
                                        <FieldContainer key={fieldIndex}>
                                            <Vertical
                                                onDrop={item =>
                                                    onDrop(item, {
                                                        row: index,
                                                        index: fieldIndex
                                                    })
                                                }
                                                isVisible={item =>
                                                    item.ui === "field" &&
                                                    (row.length < 4 ||
                                                        get(item, "pos.row") === index)
                                                }
                                            />
                                            {/* Field start */}
                                            <Draggable
                                                beginDrag={{
                                                    ui: "field",
                                                    type: field.type,
                                                    pos: {
                                                        row: index,
                                                        index: fieldIndex
                                                    }
                                                }}
                                            >
                                                {({ connectDragSource }) =>
                                                    connectDragSource(
                                                        <div className={fieldHandle}>
                                                            <Field field={field} />
                                                        </div>
                                                    )
                                                }
                                            </Draggable>
                                            {/* Field end */}
                                            {fieldIndex === row.length - 1 && (
                                                <Vertical
                                                    last
                                                    isVisible={item =>
                                                        item.ui === "field" &&
                                                        (row.length < 4 ||
                                                            get(item, "pos.row") === index)
                                                    }
                                                    onDrop={item =>
                                                        onDrop(item, {
                                                            row: index,
                                                            index: fieldIndex + 1
                                                        })
                                                    }
                                                />
                                            )}
                                        </FieldContainer>
                                    ))}
                                </Row>
                                {/* Row end */}
                                {index === fields.length - 1 && (
                                    <Horizontal
                                        last
                                        onDrop={item =>
                                            onDrop(item, {
                                                row: index + 1,
                                                index: null
                                            })
                                        }
                                    />
                                )}
                            </Elevation>
                        </RowContainer>
                    )}
                </Draggable>
            ))}

            <EditFieldDialog />
        </EditContainer>
    );
};
