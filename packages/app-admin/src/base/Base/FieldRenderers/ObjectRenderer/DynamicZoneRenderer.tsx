import React from "react";
import { observer } from "mobx-react-lite";
import type { IFieldVM } from "~/features/formModel/index.js";
import { isObjectFieldVM } from "./ObjectFieldComponents.js";
import { SingleValueDynamicZone } from "./SingleValueDynamicZone.js";
import { MultiValueDynamicZone } from "./MultiValueDynamicZone.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        dynamicZone: {
            fieldType: "object";
            settings?: undefined;
        };
    }
}

export const DynamicZoneRenderer = observer(({ field }: { field: IFieldVM }) => {
    if (!isObjectFieldVM(field)) {
        return null;
    }

    if (field.isList) {
        return <MultiValueDynamicZone field={field} />;
    }

    return <SingleValueDynamicZone field={field} />;
});
