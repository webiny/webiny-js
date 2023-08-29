import { CmsModelField } from "@webiny/app-headless-cms-common/types";

export type Field = Pick<
    CmsModelField,
    "id" | "type" | "label" | "multipleValues" | "predefinedValues" | "settings"
>;
