import { Model } from "webiny-model";
import { I18NCharAttribute, I18NObjectAttribute } from "webiny-api-i18n/attributes";
import { get } from "lodash";

class LayoutSettingsModel extends Model {
    constructor() {
        super();
        this.attr("renderer")
            .char()
            .setValue("default");
    }
}

const createReCaptchaSettingsModel = context =>
    class ReCaptchaModel extends Model {
        constructor(props) {
            super(props);
            this.attr("enabled")
                .boolean()
                .setDynamic(async () => {
                    const { FormsSettings } = context.getEntities();
                    const settings = await FormsSettings.load();
                    return Boolean(get(settings, "data.reCaptcha.enabled"));
                });
            this.attr("siteKey")
                .char()
                .setDynamic(async () => {
                    const { FormsSettings } = context.getEntities();
                    const settings = await FormsSettings.load();
                    return get(settings, "data.reCaptcha.siteKey");
                });
            this.attr("secretKey")
                .char()
                .setDynamic(async () => {
                    const { FormsSettings } = context.getEntities();
                    const settings = await FormsSettings.load();
                    return get(settings, "data.reCaptcha.secretKey");
                });
        }
    };

const createReCaptchaModel = context =>
    class ReCaptchaModel extends Model {
        constructor(props) {
            super(props);
            this.attr("enabled").boolean();
            this.attr("errorMessage")
                .custom(I18NCharAttribute, context)
                .setValue({
                    values: [
                        {
                            locale: context.i18n.getDefaultLocale().id,
                            value: "Please verify that you are not a robot."
                        }
                    ]
                });
            this.attr("settings").model(createReCaptchaSettingsModel(context));
        }
    };

const createTermsOfServiceModel = context =>
    class TermsOfServiceMessageModel extends Model {
        constructor(props) {
            super(props);
            this.attr("message").custom(I18NObjectAttribute, context);
            this.attr("errorMessage").custom(I18NCharAttribute, context);
            this.attr("enabled").boolean();
        }
    };

const createSettingsModel = context =>
    class SettingsModel extends Model {
        constructor(props) {
            super(props);
            this.attr("layout")
                .model(LayoutSettingsModel)
                .setDefaultValue(new LayoutSettingsModel());

            this.attr("submitButtonLabel").custom(I18NCharAttribute, context);
            this.attr("successMessage").custom(I18NObjectAttribute, context);
            this.attr("termsOfServiceMessage").model(createTermsOfServiceModel(context));

            const ReCaptchaModel = createReCaptchaModel(context);
            this.attr("reCaptcha").model(ReCaptchaModel).setValue(new ReCaptchaModel());
        }
    };

export default createSettingsModel;
