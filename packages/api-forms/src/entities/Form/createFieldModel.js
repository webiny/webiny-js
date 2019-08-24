import { Model } from "@webiny/model";
import { I18NCharAttribute } from "@webiny/api-i18n/attributes";

const createFieldOptionsModel = context =>
    class SettingsModel extends Model {
        constructor(props) {
            super(props);
            this.attr("label").custom(I18NCharAttribute, context);
            this.attr("value")
                .char()
                .setValue("");
        }
    };

const createFieldValidationModel = context =>
    class FieldValidationModel extends Model {
        constructor(props) {
            super(props);
            this.attr("name")
                .char()
                .setValidators("required");
            this.attr("message").custom(I18NCharAttribute, context);
            this.attr("settings")
                .object()
                .setValue({});
        }
    };

const createFieldModel = context =>
    class FieldModel extends Model {
        constructor() {
            super();
            this.attr("_id")
                .char()
                .setValidators("required");
            this.attr("type")
                .char()
                .setValidators("required");
            this.attr("name")
                .char()
                .setValidators("required");
            this.attr("fieldId")
                .char()
                .setValidators("required");
            this.attr("label").custom(I18NCharAttribute, context);
            this.attr("helpText").custom(I18NCharAttribute, context);
            this.attr("placeholderText").custom(I18NCharAttribute, context);
            this.attr("options").models(createFieldOptionsModel(context));
            this.attr("validation").models(createFieldValidationModel(context));
            this.attr("settings")
                .object()
                .setValue({});
        }
    };

export default createFieldModel;
