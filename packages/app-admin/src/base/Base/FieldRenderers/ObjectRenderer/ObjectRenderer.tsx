import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion } from "@webiny/admin-ui";
import type { IFieldVM, IObjectFieldVM } from "~/features/formModel/index.js";
import { isObjectFieldVM, NestedLayout } from "./ObjectFieldComponents.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        objectAccordionSingle: {
            fieldType: "object";
            settings?: {
                open?: boolean;
            };
        };
    }
}

export const ObjectRenderer = observer(({ field }: { field: IFieldVM }) => {
    if (!isObjectFieldVM(field)) {
        return null;
    }

    return <SingleObjectRenderer field={field} />;
});

const SingleObjectRenderer = observer(({ field }: { field: IObjectFieldVM }) => {
    return (
        <Accordion background={"base"} variant={"container"}>
            <Accordion.Item title={field.label} defaultOpen={true}>
                <NestedLayout layout={field.layout} />
            </Accordion.Item>
        </Accordion>
    );
});
