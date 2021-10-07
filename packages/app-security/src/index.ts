import plugins from "./plugins";

export * from "./components";
export * from "./contexts/Security";
export * from "./hooks/useSecurity";
export * from "./SecurityIdentity";

export default () => {
    return plugins();
};
