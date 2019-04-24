import React from "react";

export const ConfigContext = React.createContext();

export const ConfigProvider = ({ config, children }: Object) => {
    return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};

export const ConfigConsumer = ({ children }: Object) => (
    <ConfigContext.Consumer>
        {config => React.cloneElement(children, { config })}
    </ConfigContext.Consumer>
);
