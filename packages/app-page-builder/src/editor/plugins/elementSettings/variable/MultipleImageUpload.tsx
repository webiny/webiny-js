import React from "react";
import { css } from "emotion";
/**
 * Package react-sortable does not have types.
 */
// @ts-ignore
import { sortable } from "react-sortable";
import { cloneDeep } from "lodash";
import { FileManager } from "@webiny/app-admin/components";
import File from "~/editor/plugins/elements/imagesList/File";
import {
    SimpleButton,
    ButtonContainer
} from "~/editor/plugins/elementSettings/components/StyledComponents";

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

interface MultipleImageUploadProps {
    value: FileItem[];
    onChange: (value: FileItem[]) => void;
    [key: string]: any;
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({ value, onChange }) => {
    return (
        <FileManager
            images
            multiple
            onChange={files => {
                const filesArray = Array.isArray(files) ? files : [files];
                Array.isArray(value)
                    ? onChange([...value, ...filesArray])
                    : onChange([...filesArray]);
            }}
        >
            {({ showFileManager }) => (
                <>
                    <ul className="sortable-list">
                        {Array.isArray(value) &&
                            value.map((item, i) => (
                                <SortableItem
                                    key={i}
                                    onSortItems={onChange}
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
                                            onChange(updatedValue);
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

export default MultipleImageUpload;
