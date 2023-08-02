import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { makeComposable, createDecoratorFactory } from "~/index";

export interface WidgetConfig {
    name: string;
    label: string;
    description: React.ReactElement | string;
    cta:
        | {
              label: string;
              path: string;
          }
        | React.ReactElement;
}

export interface WidgetProps extends Partial<WidgetConfig> {
    name: string;
    remove?: boolean;
    before?: string;
    after?: string;
}

const BaseWidget = makeComposable<WidgetProps>(
    "Widget",
    ({ name, cta, description, label, after = undefined, before = undefined, remove = false }) => {
        const getId = useIdGenerator("widget");

        const placeAfter = after !== undefined ? getId(after) : undefined;
        const placeBefore = before !== undefined ? getId(before) : undefined;

        return (
            <Property
                id={getId(name)}
                name={"widgets"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                {label ? <Property id={getId(name, "label")} name={"label"} value={label} /> : null}
                {cta ? <Property id={getId(name, "cta")} name={"cta"} value={cta} /> : null}
                {description ? (
                    <Property
                        id={getId(name, "description")}
                        name={"description"}
                        value={description}
                    />
                ) : null}
            </Property>
        );
    }
);

const createDecorator = createDecoratorFactory()(BaseWidget);

export const Widget = Object.assign(BaseWidget, { createDecorator });
