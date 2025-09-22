import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { type DefineExtensionParams } from "./types.js";
import { type z } from "zod";

const KeyValues = (props: Record<string, any>) => {
    const getId = useIdGenerator("");
    return Object.entries(props).map(([key, value]) => {
        return <Property key={key} name={key} id={getId(key)} value={value} />;
    });
};

export function createExtensionReactComponent<TParamsSchema extends z.ZodTypeAny>(
    extensionParams: DefineExtensionParams<TParamsSchema>
) {
    type ExtensionReactComponentProps = z.infer<TParamsSchema> & {
        remove?: boolean;
        before?: string;
        after?: string;
        name?: string;
    };

    const ExtensionReactComponent: React.FC<ExtensionReactComponentProps> = props => {
        const { name, remove, before, after, ...keyValues } = props;

        const getId = useIdGenerator(extensionParams.type);

        // By passing undefined, we're letting RP generate a unique ID for us.
        const propertyId = name ? getId(name) : undefined;
        const propertyName = name || extensionParams.type;

        const placeAfter = after !== undefined ? getId(after) : undefined;
        const placeBefore = before !== undefined ? getId(before) : undefined;

        // @ts-expect-error move KeyValues back inside the Property component to avoid this error
        const KeyValuesComponent = parentProps => <KeyValues {...parentProps} {...keyValues} />;

        return (
            <Property
                id={propertyId}
                name={propertyName}
                array={extensionParams.multiple}
                remove={remove}
                before={placeBefore}
                after={placeAfter}
            >
                <KeyValuesComponent />
            </Property>
        );
    };

    ExtensionReactComponent.displayName = `ExtensionReactComponent(${extensionParams.type})`;
    return ExtensionReactComponent;
}
