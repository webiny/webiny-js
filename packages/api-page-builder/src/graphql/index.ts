import crud from "./crud";
import graphql from "./graphql";
import prerendering from "./prerendering";
import { HandlerConfiguration } from "./types";

export default (configuration: HandlerConfiguration) => [
    crud(configuration),
    graphql,
    prerendering
];
