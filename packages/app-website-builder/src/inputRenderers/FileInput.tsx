import React from "react";
import { FilePicker } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import { FileManager, type FileManagerFileItem } from "@webiny/app-admin";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import type { FileInput } from "@webiny/website-builder-sdk";
import { fileManagerItemToValue } from "~/shared/fileManagerItemToValue.js";

export const FileInputRenderer = ({
    value,
    onChange,
    label,
    ...props
}: ElementInputRendererProps) => {
    const input = props.input as FileInput;
    const { isBaseBreakpoint } = useBreakpoint();

    const onFileChange = (file: FileManagerFileItem) => {
        onChange(({ value }) => {
            const newValue = fileManagerItemToValue(file);
            value.set(newValue);
        });
    };

    const onRemove = () => {
        onChange(({ value }) => {
            if (isBaseBreakpoint) {
                value.set(undefined);
            } else {
                value.set(null);
            }
        });
    };

    // const useAdmin
    // // const fileUrl = FileUrl.create(value.src).width(128).toString();
    //
    // // 1. url + src
    // // 2. FileUrlFormatter

    console.log("vaaa", value);
    return (
        <FileManager
            accept={input.allowedFileTypes}
            onChange={onFileChange}
            render={({ showFileManager }) => (
                <FilePicker
                    label={label}
                    description={input.description}
                    type="compact"
                    value={{
                        ...value,
                        url: value.src + "?width=128px"
                    }}
                    onSelectItem={() => showFileManager()}
                    onRemoveItem={onRemove}
                    onEditItem={() => showFileManager()}
                />
            )}
        />
    );
};
