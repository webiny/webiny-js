import graphql from "./graphql";
import context from "./context";
import upgrades from "./upgrades";

export default (): any => [graphql, context, upgrades];
