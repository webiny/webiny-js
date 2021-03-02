import forms from "./crud/forms.crud";
import settings from "./crud/settings.crud";
import system from "./crud/system.crud";
import graphql from "./graphql";
import triggerHandlers from "./triggers/triggerHandlers";
import validators from "./validators";
import formsGraphQL from "./graphql/form";
import formSettingsGraphQL from "./graphql/formSettings";

export default () => [
    forms,
    settings,
    system,
    graphql,
    triggerHandlers,
    validators,
    formsGraphQL,
    formSettingsGraphQL
];
