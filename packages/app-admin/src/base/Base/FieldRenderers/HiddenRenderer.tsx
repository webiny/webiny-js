import React from "react";
import type { IFieldVM } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        hidden: { fieldType: string; settings: undefined };
    }
}

export const HiddenRenderer = (_props: { field: IFieldVM }) => {
    return null;
};
