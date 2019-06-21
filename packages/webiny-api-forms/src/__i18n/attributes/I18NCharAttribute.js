import { Model, ModelAttribute } from "webiny-model";
import type { AttributesContainer } from "webiny-model/types";
import type { I18NContext } from "webiny-api-forms/__i18n/types";

class I18NCharAttributeTranslationsModel extends Model {
    constructor() {
        super();
        this.attr("locale")
            .char()
            .setValidators("required");
        this.attr("value").char();
    }
}

const createI18NStringAttributeModel = ({ i18n }: I18NContext) =>
    class I18NCharAttributeModel extends Model {
        constructor() {
            super();
            this.attr("values")
                .models(I18NCharAttributeTranslationsModel)
                .setValue([]);
            this.attr("value")
                .char()
                .setDynamic(async () => {
                    const locale = await i18n.getLocale();
                    return this.values.find(value => value.locale === locale) || null;
                });
        }
    };

class I18NCharAttribute extends ModelAttribute {
    constructor(name: string, attributesContainer: AttributesContainer, context) {
        super(name, attributesContainer, createI18NStringAttributeModel(context));
        this.setDefaultValue(createI18NStringAttributeModel(context));
    }
}

export default I18NCharAttribute;
