import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { type FileItemDto, MultiFilePicker } from "~/MultiFilePicker/index.js";
import { AdminUiProvider } from "~/AdminUiProvider/index.js";

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

const meta: Meta<typeof MultiFilePicker> = {
    title: "Components/Form/Multi FilePicker",
    component: MultiFilePicker,
    argTypes: {
        onSelectItem: { action: "onSelectItem" },
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
            <AdminUiProvider>
                <MultiFilePicker
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
            </AdminUiProvider>
        );
    }
};

export default meta;
type Story = StoryObj<typeof MultiFilePicker>;

export const Default: Story = {};

export const AreaType: Story = {
    args: {
        ...Default.args,
        type: "area"
    }
};

export const AreaWithLabel: Story = {
    args: {
        ...AreaType.args,
        label: "Any field label"
    }
};

export const AreaWithLabelRequired: Story = {
    args: {
        ...AreaType.args,
        label: "Any field label",
        required: true
    }
};

export const AreaWithDescription: Story = {
    args: {
        ...AreaType.args,
        description: "Provide the required information for processing your request."
    }
};

export const AreaWithNotes: Story = {
    args: {
        ...AreaType.args,
        note: "Note: Ensure your selection or input is accurate before proceeding."
    }
};

export const AreaWithErrors: Story = {
    args: {
        ...AreaType.args,
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};

export const AreaDisabled: Story = {
    args: {
        ...AreaType.args,
        label: "Any field label",
        disabled: true
    }
};

export const AreaWithValidateFunction: Story = {
    args: {
        ...AreaType.args
    },
    render: args => {
        const [validation, setValidation] = useState<any>({ isValid: true, message: undefined });

        const validate = async () => {
            setValidation({ isValid: false, message: "Any custom error message." });
        };

        return <MultiFilePicker {...args} validate={validate} validation={validation} />;
    }
};

export const AreaFullExample: Story = {
    args: {
        ...AreaType.args,
        label: "Any field label",
        required: true,
        description: "Provide the required information for processing your request.",
        note: "Note: Ensure your selection or input is accurate before proceeding.",
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};

export const Compact: Story = {
    args: {
        ...Default.args,
        type: "compact"
    }
};

export const CompactWithLabel: Story = {
    args: {
        ...Compact.args,
        label: "Any field label"
    }
};

export const CompactWithLabelRequired: Story = {
    args: {
        ...Compact.args,
        label: "Any field label",
        required: true
    }
};

export const CompactWithDescription: Story = {
    args: {
        ...Compact.args,
        description: "Provide the required information for processing your request."
    }
};

export const CompactWithNotes: Story = {
    args: {
        ...Compact.args,
        note: "Note: Ensure your selection or input is accurate before proceeding."
    }
};

export const CompactWithErrors: Story = {
    args: {
        ...Compact.args,
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};

export const CompactDisabled: Story = {
    args: {
        ...Compact.args,
        label: "Any field label",
        disabled: true
    }
};

export const CompactWithValidateFunction: Story = {
    args: {
        ...Compact.args
    },
    render: args => {
        const [validation, setValidation] = useState<any>({ isValid: true, message: undefined });

        const validate = async () => {
            setValidation({ isValid: false, message: "Any custom error message." });
        };

        return <MultiFilePicker {...args} validate={validate} validation={validation} />;
    }
};

export const CompactFullExample: Story = {
    args: {
        ...Compact.args,
        label: "Any field label",
        required: true,
        description: "Provide the required information for processing your request.",
        note: "Note: Ensure your selection or input is accurate before proceeding.",
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};

export const Documentation: Story = {
    render: args => {
        const [selectedFiles, setSelectedFiles] = useState<FileItemDto[]>([]);
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        // Update value when args.values changes
        useEffect(() => {
            if (!args.values) {
                setSelectedFiles([]);
            } else if (Array.isArray(args.values)) {
                // Convert any string values to FileItemDto format
                const formattedValues = args.values.map(value => {
                    if (typeof value === "string") {
                        return {
                            name: value.split("/").pop() || "file",
                            mimeType: "image/jpeg", // Default mime type
                            size: 0,
                            url: value
                        };
                    }
                    return value as FileItemDto;
                });
                setSelectedFiles(formattedValues);
            }
        }, [args.values]);

        const handleSelect = () => {
            setSelectedFiles(createFileList(3));
            setValidation({ isValid: true, message: "" });
        };

        const handleReplace = (_: any, index: number) => {
            setSelectedFiles(prevState => {
                if (!prevState) {
                    return [];
                }

                return [
                    ...prevState.slice(0, index),
                    ...createFileList(1),
                    ...prevState.slice(index + 1)
                ];
            });
            setValidation({ isValid: true, message: "" });
        };

        const handleEdit = (file: any, index: number) => {
            if (file) {
                console.log("Editing file:", file, "at index:", index);
                alert(`Editing File: ${file.name} at position ${index}`);
            }
        };

        const handleRemove = (file: any, index: number) => {
            setSelectedFiles(prevState => prevState?.filter((_, i) => i !== index));

            if (args.required && (!selectedFiles || selectedFiles.length <= 1)) {
                setValidation({ isValid: false, message: "Please select at least one file" });
            }
        };

        // Validate on required change or value change
        useEffect(() => {
            if (args.required && (!selectedFiles || selectedFiles.length === 0)) {
                setValidation({ isValid: false, message: "Please select at least one file" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, selectedFiles]);

        return (
            <AdminUiProvider>
                <MultiFilePicker
                    {...args}
                    values={selectedFiles}
                    onSelectItem={handleSelect}
                    onReplaceItem={handleReplace}
                    onRemoveItem={handleRemove}
                    onEditItem={handleEdit}
                    validation={validation}
                />
            </AdminUiProvider>
        );
    },
    args: {
        label: "Upload Images",
        required: true,
        disabled: false,
        description: "Select files to upload (JPG, PNG, PDF)",
        note: "Note: Maximum file size is 5MB per file",
        type: "area",
        values: [],
        validation: undefined,
        onSelectItem: undefined,
        onReplaceItem: undefined,
        onEditItem: undefined,
        onRemoveItem: undefined
    },
    argTypes: {
        label: {
            description: "Label text for the file picker",
            control: "text",
            defaultValue: "Upload Images"
        },
        type: {
            description: "The type of file picker to display",
            control: "select",
            options: ["area", "compact"],
            defaultValue: "area"
        },
        required: {
            description: "Makes the field required when set to true",
            control: "boolean",
            defaultValue: true
        },
        disabled: {
            description: "Disables the field when set to true",
            control: "boolean",
            defaultValue: false
        },
        description: {
            description: "Additional description text below the field",
            control: "text"
        },
        note: {
            description: "Additional note text below the field",
            control: "text"
        },
        values: {
            description: "Array of selected files",
            control: "object"
        },
        validation: {
            description:
                "Validation state and message. Please refer to the example code for details on usage."
        },
        onSelectItem: {
            description:
                "Callback when user selects files - Please refer to the example code for details on usage.",
            action: "onSelectItem"
        },
        onReplaceItem: {
            description:
                "Callback when user replaces a file - Please refer to the example code for details on usage.",
            action: "onReplaceItem"
        },
        onEditItem: {
            description:
                "Callback when user edits a file - Please refer to the example code for details on usage.",
            action: "onEditItem"
        },
        onRemoveItem: {
            description:
                "Callback when user removes a file - Please refer to the example code for details on usage.",
            action: "onRemoveItem"
        }
    }
};
