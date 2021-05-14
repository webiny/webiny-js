import graphql from "./graphql";
import crud from "./crud";
import context from "./context";
import contentModelGroup from "../content/plugins/crud/contentModelGroup.crud";
import contentModel from "../content/plugins/crud/contentModel.crud";
import upgrades from "./upgrades";

export default () => [
    context(),
    graphql(),
    crud(),
    contentModelGroup(),
    contentModel(),
    upgrades()
];
