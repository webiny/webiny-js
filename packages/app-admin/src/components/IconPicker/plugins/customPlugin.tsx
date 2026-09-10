import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import type { FileManagerFileItem } from "~/base/ui/FileManager.js";
import { FileManager } from "~/base/ui/FileManager.js";
import { IconPickerTab } from "../IconPickerTab.js";
import { useIcon } from "../index.js";
import { useIconPicker } from "../IconPickerPresenterProvider.js";
import { IconPickerConfig } from "../config/index.js";
import { CustomIconsPresenterFeature } from "~/presentation/iconPicker/customIcons/feature.js";
import type { Icon } from "../types.js";

const CustomIcon = () => {
    const { icon, size } = useIcon<Icon>();

    return (
        <img
            width={size}
            height={size}
            src={icon.value}
            alt={icon.name}
            style={{
                verticalAlign: "middle"
            }}
        />
    );
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
            render={({ showFileManager }) => (
                <Button
                    variant={"primary"}
                    text={"Browse"}
                    onClick={() => {
                        showFileManager();
                    }}
                />
            )}
        ></FileManager>
    );
};

const CustomIconTab = observer(() => {
    const presenter = useIconPicker();

    const onIconSelect = (icon: Icon) => {
        presenter.setIcon(icon);
        presenter.closeMenu();
    };

    const onIconFileSelect = (file: FileManagerFileItem) => {
        presenter.setIcon({
            type: "custom",
            name: file.name,
            value: file.src
        });
        presenter.closeMenu();
    };

    const onIconFileUpload = (file: FileManagerFileItem) => {
        const icon = {
            type: "custom",
            name: file.name,
            value: file.src
        };

        presenter.addIcon(icon);
        presenter.setIcon(icon);
        presenter.closeMenu();
    };

    return (
        <IconPickerTab
            value={"custom"}
            label={"Custom"}
            onChange={onIconSelect}
            actions={<IconFilePicker onChange={onIconFileSelect} onUpload={onIconFileUpload} />}
        />
    );
});

export const CustomIconPlugin = () => {
    const { presenter } = useFeature(CustomIconsPresenterFeature);

    return (
        <IconPickerConfig>
            <IconPickerConfig.IconPack name="custom" provider={() => presenter.load()} />
            <IconPickerConfig.IconType name={"custom"}>
                <IconPickerConfig.IconType.Icon element={<CustomIcon />} />
                <IconPickerConfig.IconType.Tab element={<CustomIconTab />} />
            </IconPickerConfig.IconType>
        </IconPickerConfig>
    );
};
