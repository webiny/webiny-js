import type { CmsModelField as BaseCmsModelField } from "~/types";

export interface CmsModelField extends BaseCmsModelField {
    list: boolean;
}
export interface FieldFactoryResponse {
    (properties?: Partial<CmsModelField>): CmsModelField;
}

export interface FieldFactory {
    (field?: Partial<Omit<BaseCmsModelField, "type">>): FieldFactoryResponse;
}
