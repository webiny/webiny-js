import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { observer } from "mobx-react-lite";
import styled from "@emotion/styled";

import { ButtonSecondary } from "@webiny/ui/Button";

import { FileManager, FileManagerFileItem } from "~/base/ui/FileManager";
import { IconPickerTab } from "../IconPickerTab";
import { useIcon } from "..";
import { useIconPicker } from "../IconPickerPresenterProvider";
import { IconPickerConfig } from "../config";
import { ListCustomIconsQueryResponse, LIST_CUSTOM_ICONS } from "./graphql";
import { Icon } from "../types";

const AddButton = styled(ButtonSecondary)`
    &.mdc-button {
        height: 40px;
    }
`;

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
        >
            {({ showFileManager }) => (
                <AddButton
                    onClick={() => {
                        showFileManager();
                    }}
                >
                    Browse
                </AddButton>
            )}
        </FileManager>
    );
};

function getNameOrId(file: FileManagerFileItem): string {
    const name = (file.meta || []).find(obj => obj.key === "name");

    return name ? name.value : file.id;
}

const CustomIconTab = observer(() => {
    const presenter = useIconPicker();

    const onIconSelect = (icon: Icon) => {
        presenter.setIcon(icon);
        presenter.closeMenu();
    };

    const onIconFileSelect = (file: FileManagerFileItem) => {
        const name = getNameOrId(file);

        presenter.setIcon({
            type: "custom",
            name,
            value: file.src
        });
        presenter.closeMenu();
    };

    const onIconFileUpload = (file: FileManagerFileItem) => {
        console.log("onIconFileUpload", file);
        const name = getNameOrId(file);

        const icon = {
            type: "custom",
            name,
            value: file.src
        };

        presenter.addIcon(icon);
        presenter.setIcon(icon);
        presenter.closeMenu();
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
