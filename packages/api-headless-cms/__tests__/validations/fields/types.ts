import { CmsModelField as BaseCmsModelField } from "~/types";

export interface CmsModelField extends BaseCmsModelField {
    multipleValues: boolean;
}
export interface FieldFactoryResponse {
    (): CmsModelField;
}

export interface FieldFactory {
    (field?: Partial<Omit<BaseCmsModelField, "type">>): FieldFactoryResponse;
}
