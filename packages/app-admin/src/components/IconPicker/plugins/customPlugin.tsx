import React from "react";
import { useApolloClient } from "@apollo/client/react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import type { FileManagerFileItem } from "~/base/ui/FileManager.js";
import { FileManager } from "~/base/ui/FileManager.js";
import { IconPickerTab } from "../IconPickerTab.js";
import { useIcon } from "../index.js";
import { useIconPicker } from "../IconPickerPresenterProvider.js";
import { IconPickerConfig } from "../config/index.js";
import type { ListCustomIconsQueryResponse } from "./graphql.js";
import { LIST_CUSTOM_ICONS } from "./graphql.js";
import type { Icon } from "../types.js";

/**
 * NOTE: Avoid using `@emotion/styled` in icon renderer components across all plugins.
 * This is crucial for serializing component rendering into a string value as plain HTML,
 * which is necessary for usage in the website application. Please use inline styles here
 * to ensure proper serialization.
 */

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
    const client = useApolloClient();

    return (
        <IconPickerConfig>
            <IconPickerConfig.IconPack
                name="custom"
                provider={async () => {
                    const { data: response } = await client.query<ListCustomIconsQueryResponse>({
                        query: LIST_CUSTOM_ICONS,
                        variables: {
                            limit: 10000
                        }
                    });

                    if (!response) {
                        throw new Error("Network error while listing custom icons.");
                    }

                    const { data, error } = response.fileManager.listFiles;

                    if (!data) {
                        throw new Error(error?.message || "Could not fetch custom icons.");
                    }

                    return data.map(customIcon => ({
                        type: "custom",
                        name: customIcon.name,
                        value: customIcon.src
                    }));
                }}
            />
            <IconPickerConfig.IconType name={"custom"}>
                <IconPickerConfig.IconType.Icon element={<CustomIcon />} />
                <IconPickerConfig.IconType.Tab element={<CustomIconTab />} />
            </IconPickerConfig.IconType>
        </IconPickerConfig>
    );
};
