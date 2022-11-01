import React from "react";
import { css } from "emotion";
import { plugins } from "@webiny/plugins";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { Typography } from "@webiny/ui/Typography";
import { PbBlockVariable, PbEditorPageElementVariableRendererPlugin } from "~/types";

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

const VariableSettings: React.FC = () => {
    const [element] = useActiveElement();

    const elementVariableRendererPlugins =
        plugins.byType<PbEditorPageElementVariableRendererPlugin>(
            "pb-editor-page-element-variable-renderer"
        );

    return (
        <div className={wrapperStyle}>
            {element?.data?.variables?.map((variable: PbBlockVariable, index: number) => (
                <div key={index}>
                    <div className={labelStyle}>
                        <Typography use={"subtitle2"}>{variable.label}</Typography>
                    </div>
                    {elementVariableRendererPlugins
                        .find(plugin => plugin.elementType === variable?.type)
                        ?.renderVariableInput(variable.id)}
                </div>
            ))}
        </div>
    );
};

export default VariableSettings;
