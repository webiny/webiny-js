import React from "react";
import { useModelField } from "./ModelFieldProvider/index.js";

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "hcms-field-validation": {
                "data-path": string;
                "data-field-type": string;
                "data-field-multiple-values": string;
                "data-field-renderer": string;
                style: React.CSSProperties;
                children: React.ReactNode;
            };
        }
    }
}

const ValidationContainerStyles = { display: "inherit" };

export const createValidationContainer = (path: string) => {
    return function ValidationContainer({ children }: { children: React.ReactNode }) {
        const { field } = useModelField();

        if (field.multipleValues === undefined) {
            field.multipleValues = false;
        }

        return (
            <hcms-field-validation
                style={ValidationContainerStyles}
                data-path={path}
                data-field-type={field.type}
                data-field-multiple-values={String(field.multipleValues)}
                data-field-renderer={String(field.renderer.name)}
            >
                {children}
            </hcms-field-validation>
        );
    };
};
