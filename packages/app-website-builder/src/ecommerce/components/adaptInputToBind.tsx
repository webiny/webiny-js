import React from "react";
import type { BindComponentRenderProp } from "@webiny/form";
import type { ElementInputRendererProps } from "~/BaseEditor";
import { NullMetadata } from "~/BaseEditor/metadata";
import { InputValueObject } from "~/BaseEditor/hooks/useInputValue";

const metadata = new NullMetadata();
const noop = () => void 0;

export const adaptInputToBind = (Component: React.ComponentType<ElementInputRendererProps>) => {
    return function ElementInputAsFormInput(props: BindComponentRenderProp & { label: string }) {
        const onChange: ElementInputRendererProps["onChange"] = cb => {
            const value = new InputValueObject(props.value);
            cb({ value, metadata });
            props.onChange(value.get());
        };

        return (
            <Component
                {...props}
                onChange={onChange}
                metadata={metadata}
                onPreviewChange={noop}
                input={{} as any}
            />
        );
    };
};
