import context from "./context";
import graphql from "./graphql";
import upgrades from "./upgrades";

export default () => [context(), graphql, upgrades];
