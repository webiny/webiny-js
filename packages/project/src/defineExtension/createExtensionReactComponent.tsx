import React, { useMemo } from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { type DefineExtensionParams } from "./types.js";
import { type z } from "zod";
import { assertHostingType } from "~/extensions/hosting/assertHostingType.js";
import { getExtensionImplementation } from "~/extensions/hosting/getExtensionImplementation.js";

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
    const ExtensionProperty: React.FC<ExtensionReactComponentProps<TParamsSchema>> = props => {
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
            <>
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
                {extensionParams.render && extensionParams.render(props)}
            </>
        );
    };

    const ExtensionReactComponent: React.FC<
        ExtensionReactComponentProps<TParamsSchema>
    > = props => {
        assertHostingType(extensionParams.type, extensionParams.tags.hosting);

        /*
         * A hosting package may have registered its own component for this extension type. That
         * component is created by `defineExtension` too, so it finds itself here and renders as
         * usual.
         */
        const Implementation = getExtensionImplementation(extensionParams.type);
        if (Implementation && Implementation !== ExtensionReactComponent) {
            return <Implementation {...props} />;
        }

        return <ExtensionProperty {...props} />;
    };

    ExtensionReactComponent.displayName = `ExtensionReactComponent(${extensionParams.type})`;
    return ExtensionReactComponent;
}
