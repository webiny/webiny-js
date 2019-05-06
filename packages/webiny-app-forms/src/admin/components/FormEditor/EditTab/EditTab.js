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
import useEditTab from "./useEditTab";

export const EditTab = () => {
    const {
        formState: { fields, editField },
        closeFieldDialog,
        fieldDialogOpened,
        onDrop,
        saveField
    } = useEditTab();

    return (
        <EditContainer>
            {fields.length === 0 && (
                <Center onDrop={item => onDrop(item, { row: 0, index: 0 })}>
                    DROP YOUR FIRST FIELD HERE
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
            <EditFieldDialog
                open={fieldDialogOpened || Boolean(editField)}
                field={editField}
                onClose={closeFieldDialog}
                onSave={saveField}
            />
        </EditContainer>
    );
};
