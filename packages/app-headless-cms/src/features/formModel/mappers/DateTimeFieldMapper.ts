import type { ICmsFieldTypeMapper, ICmsFieldMapperContext } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

export class DateTimeFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "datetime";

    map(field: CmsModelField, registry: IFieldBuilderRegistry, context: ICmsFieldMapperContext) {
        const builder = registry.datetime();
        applyFieldProps(builder, field, context.rendererMap);

        const subtype = field.settings?.type as string | undefined;
        switch (subtype) {
            case "date":
                builder.dateOnly();
                break;
            case "time":
                builder.timeOnly();
                break;
            case "dateTimeWithTimezone":
                builder.withTimezone();
                break;
            case "dateTimeWithoutTimezone":
                builder.withoutTimezone();
                break;
        }

        return builder;
    }
}
