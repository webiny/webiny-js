import graphql from "./graphql";
import crud from "./crud";
import context from "./context";
import contentModelGroup from "../content/plugins/crud/contentModelGroup.crud";

export default () => [context(), graphql(), crud(), contentModelGroup()];
