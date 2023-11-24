import React from "react";
import { observer } from "mobx-react-lite";
import { css } from "emotion";

import { ButtonSecondary } from "@webiny/ui/Button";

import { FileManager, FileManagerFileItem } from "~/base/ui/FileManager";
import { IconPickerTab } from "../IconPickerTab";
import { useIcon } from "..";
import { useIconPicker } from "../IconPickerPresenterProvider";
import { IconType } from "../config/IconType";
import { IconPickerConfig } from "../config";
import { Icon } from "../types";

const addButtonStyle = css`
    &.mdc-button {
        height: 40px;
    }
`;

const CustomIcon = () => {
    const { icon } = useIcon<Icon>();

    return <img width={32} height={32} src={icon.value} alt={icon.name} />;
};

interface IconFilePickerProps {
    onUpload: (file: FileManagerFileItem) => void;
    onChange: (file: FileManagerFileItem) => void;
}

const IconFilePicker = ({ onUpload, onChange }: IconFilePickerProps) => {
    return (
        <FileManager
            onUploadCompletion={([file]) => {
                onUpload(file);
            }}
            onChange={onChange}
            scope="scope:iconPicker"
            accept={["image/svg+xml"]}
        >
            {({ showFileManager }) => (
                <ButtonSecondary
                    className={addButtonStyle}
                    onClick={() => {
                        showFileManager();
                    }}
                >
                    Browse
                </ButtonSecondary>
            )}
        </FileManager>
    );
};

const CustomIconTab = observer(() => {
    const presenter = useIconPicker();

    const onIconSelect = (icon: Icon) => {
        presenter.setIcon(icon);
    };

    const onIconFileSelect = (file: FileManagerFileItem) => {
        presenter.setIcon({
            type: "custom",
            name: file.name || file.id,
            value: file.src
        });
    };

    const onIconFileUpload = (file: FileManagerFileItem) => {
        const icon = {
            type: "custom",
            name: file.name || file.id,
            value: file.src
        };

        presenter.addIcon(icon);
        presenter.setIcon(icon);
    };

    return (
        <IconPickerTab
            label={"Custom"}
            onChange={onIconSelect}
            actions={<IconFilePicker onChange={onIconFileSelect} onUpload={onIconFileUpload} />}
        />
    );
});

export const CustomIconPlugin = () => {
    return (
        <IconPickerConfig>
            <IconType name={"custom"}>
                <IconType.Icon element={<CustomIcon />} />
                <IconType.Tab element={<CustomIconTab />} />
            </IconType>
        </IconPickerConfig>
    );
};
