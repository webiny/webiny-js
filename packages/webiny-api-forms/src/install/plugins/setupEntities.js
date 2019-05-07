// @flow
import { categoryFactory } from "./../../entities/Category.entity";
import { menuFactory } from "./../../entities/Menu.entity";
import { formFactory } from "./../../entities/Form.entity";
import { elementFactory } from "./../../entities/Element.entity";
import { formsSettingsFactory } from "./../../entities/FormsSettings.entity";

export default (context: Object) => {
    context.forms = { ...context.forms, entities: {} };

    context.forms.entities.Category = categoryFactory();
    context.forms.entities.Form = formFactory(context);
    context.forms.entities.Menu = menuFactory();
    context.forms.entities.Element = elementFactory();
    context.forms.entities.FormsSettings = formsSettingsFactory(context);
};
