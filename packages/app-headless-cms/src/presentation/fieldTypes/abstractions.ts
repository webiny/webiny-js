import React from "react";
import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel, CmsModelField, DragSource } from "~/types.js";
import type {
    CmsModelFieldValidatorsGroup,
    CmsModelFieldValidatorsFactory
} from "@webiny/app-headless-cms-common/types/validation.js";

export interface ICmsFieldType {
    readonly type: string;
    readonly label: string;
    readonly description: string;
    readonly icon: React.ReactElement;

    readonly allowList: boolean;
    readonly listLabel?: string;
    readonly allowPredefinedValues: boolean;

    readonly validators?: string[] | CmsModelFieldValidatorsGroup | CmsModelFieldValidatorsFactory;
    readonly listValidators?:
        | string[]
        | CmsModelFieldValidatorsGroup
        | CmsModelFieldValidatorsFactory;

    readonly hideInAdmin?: boolean;
    readonly tags?: string[];
    readonly canEditSettings?: boolean;
    readonly allowLayout?: boolean;

    canAccept?(field: CmsModelField, draggable: DragSource): boolean;

    renderEditor?(params: { field: CmsModelField; model: CmsModel }): React.ReactNode;

    createField(): Pick<CmsModelField, "type" | "validation" | "renderer" | "settings">;
}

export const CmsFieldType = createAbstraction<ICmsFieldType>("CmsFieldType");

export namespace CmsFieldType {
    export type Interface = ICmsFieldType;
}
