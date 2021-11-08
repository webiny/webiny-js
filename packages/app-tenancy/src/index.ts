import installation from "~/plugins/installation";
export * from "./contexts/Tenancy";
export * from "./hooks/useTenancy";
export * from "./withTenant";

export const plugins = () => [installation];
