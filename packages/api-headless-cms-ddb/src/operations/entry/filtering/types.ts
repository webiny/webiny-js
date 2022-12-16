import { CmsModelField } from "@webiny/api-headless-cms/types";
import { CreatePathCallable } from "~/plugins";

interface FieldValueTransform {
    (value: any): any;
}

export interface FieldParent {
    fieldId: string;
    multipleValues?: boolean;
}

export interface Field
    extends Partial<Omit<CmsModelField, "id" | "type" | "storageId" | "fieldId">>,
        Pick<CmsModelField, "id" | "type" | "storageId" | "fieldId"> {
    /**
     * A list od fieldId of all parents of the current field.
     *
     * This is used to check if we need to iterate through an array of parent values.
     */
    parents: FieldParent[];
    /**
     * The method which creates a path for the filtering.
     *
     * Always exists. In most cases it will return some fixed value.
     * When having a CmsEntryFieldFilterPathPlugin then it is executed to create a path.
     */
    createPath: CreatePathCallable;
    /**
     * In most cases, return value of this method is what ever is the input.
     *
     * In some cases there might be a CmsFieldFilterValueTransformPlugin, which transforms value to a comparable one.
     * For example, time in format 15:45:58 is not comparable, so we transform it into the seconds and then compare.
     */
    transform: FieldValueTransform;
    /**
     * Is the field a system field?
     * System fields are built into the code and cannot be changed.
     */
    system: boolean;
}

export interface FilterItemFromStorage {
    <T = any>(
        field: Partial<CmsModelField> &
            Pick<CmsModelField, "fieldId" | "storageId" | "id" | "settings" | "type">,
        value: any
    ): Promise<T>;
}
