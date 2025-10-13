import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { type FileItemDto, FilePicker } from "~/FilePicker/index.js";
import { AdminUiProvider } from "~/AdminUiProvider/index.js";

const getRandomNumber = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const getFile = (): FileItemDto => {
    const width = getRandomNumber(500, 2000); // Random width between 500 and 2000
    const height = getRandomNumber(500, 2000); // Random height between 500 and 2000
    const fileSize = getRandomNumber(500000, 5000000); // Random file size between 500KB and 5MB

    return {
        name: "selected-file.jpg",
        mimeType: "image/jpeg",
        size: fileSize,
        url: `https://picsum.photos/${width}/${height}`
    };
};

const meta: Meta<typeof FilePicker> = {
    title: "Components/Form/FilePicker",
    component: FilePicker,
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
        const [selectedFile, setSelectedFile] = useState(args.value);
        return (
            <AdminUiProvider>
                <FilePicker
                    {...args}
                    value={selectedFile}
                    onSelectItem={() => setSelectedFile(getFile())}
                    onRemoveItem={() => setSelectedFile(null)}
                    onEditItem={() => alert(`Editing File`)}
                />
            </AdminUiProvider>
        );
    }
};

export default meta;
type Story = StoryObj<typeof FilePicker>;

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

        return <FilePicker {...args} validate={validate} validation={validation} />;
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

        return <FilePicker {...args} validate={validate} validation={validation} />;
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
        const [selectedFile, setSelectedFile] = useState(args.value);
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        // Update value when args.value changes
        useEffect(() => {
            setSelectedFile(args.value);
        }, [args.value]);

        const handleSelect = () => {
            setSelectedFile(getFile());
            setValidation({ isValid: true, message: "" });
        };

        const handleEdit = (file: any) => {
            if (file) {
                console.log("Editing file:", file);
                alert(`Editing File: ${file.name}`);
            }
        };

        const handleRemove = () => {
            setSelectedFile(null);

            if (args.required) {
                setValidation({ isValid: false, message: "Please select a file" });
            }
        };

        // Validate on required change or value change
        useEffect(() => {
            if (args.required && !selectedFile) {
                setValidation({ isValid: false, message: "Please select a file" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, selectedFile]);

        return (
            <AdminUiProvider>
                <FilePicker
                    {...args}
                    value={selectedFile}
                    onSelectItem={handleSelect}
                    onRemoveItem={handleRemove}
                    onEditItem={handleEdit}
                    validation={validation}
                />
            </AdminUiProvider>
        );
    },
    args: {
        label: "Upload Image",
        required: true,
        disabled: false,
        description: "Select a file to upload (JPG, PNG, PDF)",
        note: "Note: Maximum file size is 5MB",
        type: "area",
        value: null,
        validation: undefined,
        onSelectItem: undefined,
        onEditItem: undefined,
        onRemoveItem: undefined
    },
    argTypes: {
        label: {
            description: "Label text for the file picker",
            control: "text"
        },
        required: {
            description: "Makes the field required when set to true",
            control: "boolean"
        },
        disabled: {
            description: "Disables the file picker when set to true",
            control: "boolean"
        },
        description: {
            description: "Additional description text below the field",
            control: "text"
        },
        note: {
            description: "Additional note text below the field",
            control: "text"
        },
        type: {
            description: "The visual style of the file picker",
            control: "radio",
            options: ["area", "compact"]
        },
        value: {
            description: "The currently selected file",
            control: "object"
        },
        validation: {
            description:
                "Object containing validation state and message. Please refer to the example code for details on usage."
        },
        onSelectItem: {
            description: "Function called when a file is selected"
        },
        onEditItem: {
            description: "Function called when a file is edited"
        },
        onRemoveItem: {
            description: "Function called when a file is removed"
        }
    }
};
