import installation from "~/plugins/installation";
export * from "./contexts/Tenancy";
export * from "./hooks/useTenancy";
export * from "./withTenant";
export * from "./Tenancy";

export const plugins = () => [installation];
