import type { ICmsFieldTypeMapper, ICmsFieldMapperContext } from "../abstractions.js";
import type {
    IFieldBuilder,
    IFieldBuilderRegistry,
    IObjectFieldBuilder
} from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField, CmsDynamicZoneTemplate } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";
import type { ITemplateIcon } from "@webiny/app-admin/features/formModel/index.js";

export class DynamicZoneFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "dynamicZone";

    map(
        field: CmsModelField,
        registry: IFieldBuilderRegistry,
        context: ICmsFieldMapperContext
    ): IFieldBuilder {
        const builder = registry.object() as IObjectFieldBuilder;

        const templates = field.settings?.templates as CmsDynamicZoneTemplate[] | undefined;
        if (templates) {
            for (const template of templates) {
                builder.template(template.id, t => {
                    t.label(template.name);
                    if (template.icon) {
                        const icon = template.icon;
                        if (typeof icon === "object" && "name" in icon) {
                            t.icon(icon as ITemplateIcon);
                        } else if (typeof icon === "string") {
                            t.icon({ type: "icon", name: icon });
                        }
                    }
                    if (template.fields && template.fields.length > 0) {
                        t.fields(childRegistry => {
                            const result: Record<string, IFieldBuilder> = {};
                            for (const child of template.fields) {
                                result[child.fieldId] = context.mapField(child, childRegistry);
                            }
                            return result;
                        });
                    }
                });
            }
        }

        return applyFieldProps(builder, field);
    }
}
