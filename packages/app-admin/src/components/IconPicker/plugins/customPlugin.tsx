import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { observer } from "mobx-react-lite";
import { css } from "emotion";

import { ButtonSecondary } from "@webiny/ui/Button";

import { FileManager, FileManagerFileItem } from "~/base/ui/FileManager";
import { IconPickerTab } from "../IconPickerTab";
import { useIcon } from "..";
import { useIconPicker } from "../IconPickerPresenterProvider";
import { IconType } from "../config/IconType";
import { IconPickerConfig } from "../config";
import { ListCustomIconsQueryResponse, LIST_CUSTOM_ICONS } from "../config/graphql";
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
            <IconType name={"custom"}>
                <IconType.Icon element={<CustomIcon />} />
                <IconType.Tab element={<CustomIconTab />} />
            </IconType>
        </IconPickerConfig>
    );
};
