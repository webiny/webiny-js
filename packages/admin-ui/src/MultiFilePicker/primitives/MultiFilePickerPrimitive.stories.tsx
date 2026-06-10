import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MultiFilePickerPrimitive, type FileItemDto } from "./MultiFilePickerPrimitive.js";

const getRandomNumber = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const createFileList = (size: number = 10): FileItemDto[] => {
    return Array.from({ length: size }, (_, index) => {
        const width = getRandomNumber(500, 2000); // Random width between 500 and 2000
        const height = getRandomNumber(500, 2000); // Random height between 500 and 2000
        const fileSize = getRandomNumber(500000, 5000000); // Random file size between 500KB and 5MB

        return {
            name: `file-${index + 1}.jpg`,
            mimeType: "image/jpeg",
            size: fileSize,
            url: `https://picsum.photos/${width}/${height}`
        };
    });
};

const meta: Meta<typeof MultiFilePickerPrimitive> = {
    title: "Components/Form Primitives/Multi FilePicker",
    component: MultiFilePickerPrimitive,
    argTypes: {
        onSelectItem: { action: "onSelectItem" },
        onReplaceItem: { action: "onReplaceItem" },
        onEditItem: { action: "onEditItem" },
        onRemoveItem: { action: "onRemoveItem" },
        disabled: {
            control: "boolean",
            defaultValue: false
        }
    },
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [selectedFiles, setSelectedFiles] = useState<FileItemDto[]>([]);
        return (
            <MultiFilePickerPrimitive
                {...args}
                values={selectedFiles}
                onSelectItem={() => setSelectedFiles(createFileList())}
                onReplaceItem={(_, index) =>
                    setSelectedFiles(prevState => {
                        if (!prevState) {
                            return [];
                        }

                        return [
                            ...prevState.slice(0, index),
                            ...createFileList(1),
                            ...prevState.slice(index + 1)
                        ];
                    })
                }
                onRemoveItem={item =>
                    setSelectedFiles(prevState =>
                        prevState?.filter(value => value.name !== item?.name)
                    )
                }
                onEditItem={(item, i) => alert(`Editing ${item?.name} at position ${i}`)}
            />
        );
    }
};

export default meta;
type Story = StoryObj<typeof MultiFilePickerPrimitive>;

export const Default: Story = {
    args: {
        label: "Add gallery files"
    }
};

export const AreaType: Story = {
    args: {
        ...Default.args,
        type: "area"
    }
};

export const AreaPrimaryVariant: Story = {
    args: {
        ...AreaType.args,
        variant: "primary"
    }
};

export const AreaPrimaryVariantDisabled: Story = {
    args: {
        ...AreaPrimaryVariant.args,
        disabled: true
    }
};

export const AreaPrimaryVariantInvalid: Story = {
    args: {
        ...AreaPrimaryVariant.args,
        invalid: true
    }
};

export const AreaSecondaryVariant: Story = {
    args: {
        ...AreaType.args,
        variant: "secondary"
    }
};

export const AreaSecondaryVariantDisabled: Story = {
    args: {
        ...AreaSecondaryVariant.args,
        disabled: true
    }
};

export const AreaSecondaryVariantInvalid: Story = {
    args: {
        ...AreaSecondaryVariant.args,
        invalid: true
    }
};

export const AreaGhostVariant: Story = {
    args: {
        ...AreaType.args,
        variant: "ghost"
    }
};

export const AreaGhostVariantDisabled: Story = {
    args: {
        ...AreaGhostVariant.args,
        disabled: true
    }
};

export const AreaGhostVariantInvalid: Story = {
    args: {
        ...AreaGhostVariant.args,
        invalid: true
    }
};

export const AreaWithImagePreview: Story = {
    args: {
        ...AreaType.args,
        renderFilePreview: props => <MultiFilePickerPrimitive.Preview.Image {...props} />
    }
};

export const AreaWithImagePreviewLight: Story = {
    args: {
        ...AreaWithImagePreview.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.Image variant={"light"} {...props} />
        )
    }
};

export const AreaWithImagePreviewBase: Story = {
    args: {
        ...AreaWithImagePreview.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.Image variant={"base"} {...props} />
        )
    }
};

export const AreaWithImagePreviewTransparent: Story = {
    args: {
        ...AreaWithImagePreview.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.Image variant={"transparent"} {...props} />
        )
    }
};

export const AreaWithRichItemPreview: Story = {
    args: {
        ...AreaType.args,
        renderFilePreview: props => <MultiFilePickerPrimitive.Preview.RichItem {...props} />
    }
};

export const AreaWithRichItemPreviewLight: Story = {
    args: {
        ...AreaWithRichItemPreview.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.RichItem variant={"light"} {...props} />
        )
    }
};

export const AreaWithRichItemPreviewBase: Story = {
    args: {
        ...AreaWithRichItemPreview.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.RichItem variant={"base"} {...props} />
        )
    }
};

export const AreaWithRichItemPreviewTransparent: Story = {
    args: {
        ...AreaWithRichItemPreview.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.RichItem variant={"transparent"} {...props} />
        )
    }
};

export const AreaWithRichItemThumbnailPreview: Story = {
    args: {
        ...AreaType.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.RichItem preview={"thumbnail"} {...props} />
        )
    }
};

export const AreaWithRichItemFileTypePreview: Story = {
    args: {
        ...AreaType.args,
        values: [
            {
                name: "export.csv",
                url: "export.csv",
                mimeType: "text/csv",
                size: 100000
            }
        ],
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.RichItem preview={"file-type"} {...props} />
        )
    }
};

export const AreaWithRichItemFileTypePlaceholder: Story = {
    args: {
        ...AreaType.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.RichItem preview={"placeholder"} {...props} />
        )
    }
};

export const AreaWithTextOnlyPreview: Story = {
    args: {
        ...AreaType.args,
        renderFilePreview: props => <MultiFilePickerPrimitive.Preview.TextOnly {...props} />
    }
};

export const AreaWithTextOnlyPreviewLight: Story = {
    args: {
        ...AreaWithTextOnlyPreview.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.TextOnly variant={"light"} {...props} />
        )
    }
};

export const AreaWithTextOnlyPreviewBase: Story = {
    args: {
        ...AreaWithTextOnlyPreview.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.TextOnly variant={"base"} {...props} />
        )
    }
};

export const AreaWithTextOnlyPreviewTransparent: Story = {
    args: {
        ...AreaWithTextOnlyPreview.args,
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.TextOnly variant={"transparent"} {...props} />
        )
    }
};

export const CompactType: Story = {
    args: {
        ...Default.args,
        type: "compact"
    }
};

export const CompactPrimaryVariant: Story = {
    args: {
        ...CompactType.args,
        variant: "primary"
    }
};

export const CompactPrimaryVariantDisabled: Story = {
    args: {
        ...CompactPrimaryVariant.args,
        disabled: true
    }
};

export const CompactPrimaryVariantInvalid: Story = {
    args: {
        ...CompactPrimaryVariant.args,
        invalid: true
    }
};

export const CompactSecondaryVariant: Story = {
    args: {
        ...CompactType.args,
        variant: "secondary"
    }
};

export const CompactSecondaryVariantDisabled: Story = {
    args: {
        ...CompactSecondaryVariant.args,
        disabled: true
    }
};

export const CompactSecondaryVariantInvalid: Story = {
    args: {
        ...CompactSecondaryVariant.args,
        invalid: true
    }
};

export const CompactGhostVariant: Story = {
    args: {
        ...CompactType.args,
        variant: "ghost"
    }
};

export const CompactGhostVariantDisabled: Story = {
    args: {
        ...CompactGhostVariant.args,
        disabled: true
    }
};

export const CompactGhostVariantInvalid: Story = {
    args: {
        ...CompactGhostVariant.args,
        invalid: true
    }
};

export const CompactWithTextOnlyPreviewSmall: Story = {
    args: {
        ...CompactType.args,
        values: createFileList(50),
        renderFilePreview: props => (
            <MultiFilePickerPrimitive.Preview.TextOnly {...props} small={true} />
        )
    }
};
