// @flow
import type { PluginType } from "webiny-api/types";
import type { Entity } from "webiny-entity";
import { Model } from "webiny-model";
import { createValidator } from "webiny-api-headless/utils";

type HeadlessFieldTypePlugin = PluginType & {
    fieldType: string,
    createAttribute: ({ field: Object, entity: Entity, context: Object }) => void
};

export default ([
    {
        name: "cms-headless-field-type-text",
        type: "cms-headless-field-type",
        fieldType: "text",
        createAttribute({ field, entity, context }) {
            class TextValueModel extends Model {
                constructor() {
                    super();

                    this.attr("locale").char();
                    this.attr("value")
                        .char()
                        .setValidators(createValidator({ field, entity, context }));
                }
            }

            entity
                .attr(field.fieldId)
                .models(TextValueModel)
                .onSet(newValue => {
                    /* $FlowFixMe */
                    const currentValue = entity.getAttribute(field.fieldId).getValue();
                    if (Array.isArray(currentValue) && currentValue.length > 0) {
                        const mergedValue = currentValue.map(model => ({
                            /* $FlowFixMe */
                            value: model.value,
                            /* $FlowFixMe */
                            locale: model.locale
                        }));

                        newValue.forEach(({ value, locale }) => {
                            const index = mergedValue.findIndex(v => v.locale === locale);
                            if (index === -1) {
                                mergedValue.push({ value, locale });
                            } else {
                                mergedValue[index].value = value;
                            }
                        });

                        return mergedValue;
                    }
                    return newValue;
                });
        },
        readResolver(entity, args, context, { fieldName }) {
            let value = entity[fieldName].find(v => v.locale === context.locale);
            if (!value) {
                value = entity[fieldName].find(v => v.locale === context.defaultLocale);
            }

            return value.value;
        }
    }
]: Array<HeadlessFieldTypePlugin>);
