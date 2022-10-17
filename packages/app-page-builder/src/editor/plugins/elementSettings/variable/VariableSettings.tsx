import React, { useCallback } from "react";
import { css } from "emotion";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { Typography } from "@webiny/ui/Typography";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { PbBlockVariable } from "~/types";
import RichInput from "~/editor/plugins/elementSettings/variable/RichInput";
import TextInput from "~/editor/plugins/elementSettings/variable/TextInput";
import MultipleImageUpload from "~/editor/plugins/elementSettings/variable/MultipleImageUpload";

const wrapperStyle = css({
    padding: "16px",
    display: "grid",
    rowGap: "20px"
});

const labelStyle = css({
    marginBottom: "8px",
    "& span": {
        color: "var(--mdc-theme-text-primary-on-background)"
    }
});

const buttonInputsWrapperStyle = css({
    display: "grid",
    rowGap: "8px"
});

const textToBlockQuote = (text: string) => {
    return `<blockquote><q>${text}</q></blockquote>`;
};

const blockQuoteToText = (text: string) => {
    return text.replace("<blockquote><q>", "").replace("</q></blockquote>", "");
};

const VariableSettings: React.FC = () => {
    const [element] = useActiveElement();
    const updateElement = useUpdateElement();

    const onChange = useCallback(
        (value: any, variableId: string, history = false) => {
            if (element) {
                const newVariables = element?.data?.variables?.map((variable: PbBlockVariable) => {
                    if (variable?.id === variableId) {
                        return {
                            ...variable,
                            value
                        };
                    }

                    return variable;
                });
                updateElement(
                    {
                        ...element,
                        data: {
                            ...element.data,
                            variables: newVariables
                        }
                    },
                    {
                        history
                    }
                );
            }
        },
        [element, updateElement]
    );

    const onBlur = useCallback(() => {
        if (element) {
            updateElement(element);
        }
    }, [element, updateElement]);

    return (
        <div className={wrapperStyle}>
            {element?.data?.variables?.map((variable: PbBlockVariable, index: number) => (
                <div key={index}>
                    <div className={labelStyle}>
                        <Typography use={"subtitle2"}>{variable.label}</Typography>
                    </div>
                    {variable.type === "heading" && (
                        <TextInput
                            value={variable?.value}
                            onChange={value => onChange(value, variable.id)}
                            onBlur={onBlur}
                        />
                    )}
                    {(variable.type === "paragraph" || variable.type === "list") && (
                        <RichInput
                            value={variable?.value}
                            onSelect={value => onChange(value, variable.id)}
                            onChange={onBlur}
                        />
                    )}
                    {variable.type === "image" && (
                        <SingleImageUpload
                            onChange={(value: File) => onChange(value, variable.id, true)}
                            value={{ src: variable?.value?.src || "" }}
                        />
                    )}
                    {variable.type === "images-list" && (
                        <MultipleImageUpload
                            value={variable?.value}
                            onChange={value => onChange(value, variable.id, true)}
                        />
                    )}
                    {variable.type === "quote" && (
                        <TextInput
                            value={blockQuoteToText(variable?.value)}
                            onChange={value => onChange(textToBlockQuote(value), variable.id)}
                            onBlur={onBlur}
                        />
                    )}
                    {variable.type === "button" && (
                        <div className={buttonInputsWrapperStyle}>
                            <TextInput
                                label="Label"
                                value={variable?.value?.label}
                                onChange={value =>
                                    onChange({ ...variable.value, label: value }, variable.id)
                                }
                                onBlur={onBlur}
                            />
                            <TextInput
                                label="URL"
                                value={variable?.value?.url}
                                onChange={value =>
                                    onChange({ ...variable.value, url: value }, variable.id)
                                }
                                onBlur={onBlur}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default VariableSettings;
