import { Model, ModelAttribute } from "webiny-model";
import type { AttributesContainer } from "webiny-model/types";
import type { I18NContext } from "webiny-api-i18n/types";

class I18NObjectAttributeTranslationsModel extends Model {
    constructor() {
        super();
        this.attr("locale")
            .object()
            .setValidators("required");
        this.attr("value").object();
    }
}

const createI18NObjectAttributeModel = ({ i18n }: I18NContext) =>
    class I18NObjectAttributeModel extends Model {
        constructor() {
            super();
            this.attr("values")
                .models(I18NObjectAttributeTranslationsModel)
                .setValue([]);
            this.attr("value")
                .object()
                .setDynamic(async () => {
                    const locale = await i18n.getLocale();
                    return this.values.find(value => value.locale === locale) || null;
                });
        }
    };

class I18NObjectAttribute extends ModelAttribute {
    constructor(name: string, attributesContainer: AttributesContainer, context) {
        super(name, attributesContainer, createI18NObjectAttributeModel(context));
        this.setDefaultValue(createI18NObjectAttributeModel(context));
    }
}

export default I18NObjectAttribute;
