import { Model, ModelAttribute } from "webiny-model";
import type { AttributesContainer } from "webiny-model/types";
import type { I18NContext } from "webiny-api-i18n/types";
import onGetI18NValues from "./onGetI18NValues";

class I18NObjectAttributeTranslationsModel extends Model {
    constructor() {
        super();
        this.attr("locale")
            .char()
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
                .onGet(value => onGetI18NValues(value, i18n))
                .setValue([]);
            this.attr("value")
                .object()
                .setDynamic(() => {
                    const locale = i18n.getLocale();
                    const value = this.values.find(value => value.locale === locale.id);
                    return value ? value.value : null;
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
