import cruds from "./crud";
import graphql from "./graphql";
import upgrades from "./upgrades";
import triggerHandlers from "./triggers/triggerHandlers";
import validators from "./validators";
import formsGraphQL from "./graphql/form";
import formSettingsGraphQL from "./graphql/formSettings";

export default () => [
    cruds(),
    graphql,
    upgrades,
    triggerHandlers,
    validators,
    formsGraphQL,
    formSettingsGraphQL
];
