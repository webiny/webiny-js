import models from "./models";
import graphql from "./graphql";

export default () => [
    models(),
    graphql
    /* ... Other plugins to be exported ... */
];
