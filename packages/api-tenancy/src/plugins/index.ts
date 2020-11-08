import graphql from "./graphql";
import tenancyContext from "./context";

export default () => [
    tenancyContext,
    graphql
];
