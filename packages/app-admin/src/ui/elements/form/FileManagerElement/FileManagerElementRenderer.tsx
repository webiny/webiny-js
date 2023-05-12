import React from "react";
import styled from "@emotion/styled";
import { UIRenderer, UIRenderParams } from "~/ui/UIRenderer";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { FileManagerElement } from "~/ui/elements/form/FileManagerElement";
import { FileManager, FileManagerFileItem } from "~/base/ui/FileManager";
import { FormFieldElementRenderProps } from "~/ui/elements/form/FormFieldElement";

const ImageUploadWrapper = styled("div")({
    position: "relative",
    ".disabled": {
        opacity: 0.75,
        pointerEvents: "none"
    },
    ".mdc-floating-label--float-above": {
        transform: "scale(0.75)",
        top: 10,
        left: 10,
        color: "var(--mdc-theme-text-secondary-on-background)"
    },
    ".mdc-text-field-helper-text": {
        color: "var(--mdc-theme-text-secondary-on-background)"
    }
});

export interface FileManagerElementRenderProps extends FormFieldElementRenderProps {
    fileManagerElement: FileManagerElement;
    value: any;
    showFileManager: () => void;
    onChange: (value: any) => void;
}

export class FileManagerElementRenderer extends UIRenderer<
    FileManagerElement,
    FormFieldElementRenderProps
> {
    public override render({
        element,
        props
    }: UIRenderParams<FileManagerElement, FormFieldElementRenderProps>): React.ReactNode {
        if (!props.formProps) {
            throw Error(`FileManagerElement must be placed inside of a FormElement.`);
        }

        const { Bind } = props.formProps;

        const accept = element.getAccept();
        const label = element.getLabel(props);
        const description = element.getDescription(props);

        return (
            <Bind
                name={element.getName()}
                validators={element.getValidators(props)}
                defaultValue={element.getDefaultValue(props)}
                beforeChange={(value: string, cb) => element.onBeforeChange(value, cb)}
                afterChange={(value: string, form) => element.onAfterChange(value, form)}
            >
                {({ value, onChange, validation }) => (
                    <ImageUploadWrapper>
                        {label && (
                            <div className="mdc-floating-label mdc-floating-label--float-above">
                                {label}
                            </div>
                        )}

                        <FileManager
                            onChange={(value: FileManagerFileItem | null) =>
                                onChange(value ? { id: value.id, src: value.src } : null)
                            }
                            accept={accept}
                            images={!accept}
                            maxSize={element.getMaxSize()}
                            render={({ showFileManager }) =>
                                element.getEmptyStateElement().render({
                                    ...props,
                                    fileManagerElement: element,
                                    showFileManager,
                                    value,
                                    onChange: (value: FileManagerFileItem | null) =>
                                        onChange(value ? { id: value.id, src: value.src } : null)
                                })
                            }
                        />

                        {validation.isValid === false && (
                            <FormElementMessage error>{validation.message}</FormElementMessage>
                        )}
                        {validation.isValid !== false && description && (
                            <FormElementMessage>{description}</FormElementMessage>
                        )}
                    </ImageUploadWrapper>
                )}
            </Bind>
        );
    }
}
