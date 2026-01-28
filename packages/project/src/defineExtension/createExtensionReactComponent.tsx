import React, { useMemo } from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { type DefineExtensionParams } from "./types.js";
import { type z } from "zod";

const KeyValues = (props: Record<string, any>) => {
    const getId = useIdGenerator("");
    return Object.entries(props).map(([key, value]) => {
        return <Property key={key} name={key} id={getId(key)} value={value} />;
    });
};

type ExtensionReactComponentProps<TParamsSchema extends z.ZodTypeAny> = z.infer<TParamsSchema> & {
    remove?: boolean;
    before?: string;
    after?: string;
    name?: string;
};

export function createExtensionReactComponent<TParamsSchema extends z.ZodTypeAny>(
    extensionParams: DefineExtensionParams<TParamsSchema>
) {
    const ExtensionReactComponent: React.FC<
        ExtensionReactComponentProps<TParamsSchema>
    > = props => {
        // If custom render function is provided, use it.
        if (extensionParams.render) {
            return <>{extensionParams.render(props)}</>;
        }

        const { name, remove, before, after, ...keyValues } = props;

        const getId = useIdGenerator(extensionParams.type);

        // By passing undefined, we're letting RP generate a unique ID for us.
        const propertyId = useMemo(() => {
            if (extensionParams.multiple) {
                return name ? getId(name) : undefined;
            }

            return getId(extensionParams.type);
        }, [name, extensionParams.multiple, getId]);

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
