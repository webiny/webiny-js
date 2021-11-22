import graphql from "~/plugins/graphql";
import context from "./plugins/context";

export default () => [context(), graphql()];
