import installation from "~/plugins/installation";
export { useTenancy } from "@webiny/app-admin";
export * from "./withTenant";
export * from "./Tenancy";

export const plugins = () => [installation];
