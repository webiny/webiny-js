import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModelField } from "~/types.js";
import type {
    CmsModelFieldValidatorsGroup,
    CmsModelFieldValidatorsFactory
} from "@webiny/app-headless-cms-common/types/validation.js";

export interface ICmsFieldType {
    readonly type: string;
    readonly label: string;
    readonly description: string;
    readonly icon: string;

    readonly allowList: boolean;
    readonly listLabel?: string;
    readonly allowPredefinedValues: boolean;

    readonly validators?: string[] | CmsModelFieldValidatorsGroup | CmsModelFieldValidatorsFactory;
    readonly listValidators?:
        | string[]
        | CmsModelFieldValidatorsGroup
        | CmsModelFieldValidatorsFactory;

    createField(): Pick<CmsModelField, "type" | "validation" | "renderer" | "settings">;
}

export const CmsFieldType = createAbstraction<ICmsFieldType>("CmsFieldType");

export namespace CmsFieldType {
    export type Interface = ICmsFieldType;
}
