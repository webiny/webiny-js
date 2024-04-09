import React from "react";
import { css } from "emotion";
/**
 * Package react-sortable does not have types.
 */
// @ts-expect-error
import { sortable } from "react-sortable";
import cloneDeep from "lodash/cloneDeep";
import { FileManager } from "@webiny/app-admin/components";
import File from "~/editor/plugins/elements/imagesList/File";
import {
    SimpleButton,
    ButtonContainer
} from "~/editor/plugins/elementSettings/components/StyledComponents";
import { useVariable } from "~/hooks/useVariable";

const style = {
    addImagesButton: css({ clear: "both", padding: "20px 10px", textAlign: "center" }),
    liItem: {
        display: "inline-block"
    }
};

class Item extends React.Component {
    public override render() {
        return (
            <li style={style.liItem} {...this.props}>
                {this.props.children}
            </li>
        );
    }
}

const SortableItem = sortable(Item);

interface MultipleImageVariableInputProps {
    variableId: string;
}

const MultipleImageVariableInput = ({ variableId }: MultipleImageVariableInputProps) => {
    const { value, onChange } = useVariable(variableId);

    // TODO: Update to use the new `render` prop, implemented in 5.33.0.
    return (
        <FileManager
            images
            multiple
            onChange={files => {
                const filesArray = Array.isArray(files) ? files : [files];
                Array.isArray(value)
                    ? onChange([...value, ...filesArray], true)
                    : onChange([...filesArray], true);
            }}
        >
            {({ showFileManager }) => (
                <>
                    <ul className="sortable-list">
                        {Array.isArray(value) &&
                            value.map((item, i) => (
                                <SortableItem
                                    key={i}
                                    onSortItems={(val: any) => onChange(val, true)}
                                    // Clone item so lib can modify it
                                    items={cloneDeep(value)}
                                    sortId={i}
                                >
                                    <File
                                        file={item}
                                        onRemove={() => {
                                            // Remove the image at index i
                                            const updatedValue = [
                                                ...value.slice(0, i),
                                                ...value.slice(i + 1)
                                            ];
                                            onChange(updatedValue, true);
                                        }}
                                    />
                                </SortableItem>
                            ))}
                    </ul>
                    <ButtonContainer>
                        <SimpleButton onClick={() => showFileManager()}>Add images...</SimpleButton>
                    </ButtonContainer>
                </>
            )}
        </FileManager>
    );
};

export default MultipleImageVariableInput;
