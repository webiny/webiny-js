import React from "react";

const { Provider, Consumer } = React.createContext({});

export const ThemeContextProvider = ({ theme, children }) => (
    <Provider value={theme}>{children}</Provider>
);

export const ThemeContextConsumer = ({ children }) => (
    <Consumer>{theme => React.cloneElement(children, { theme })}</Consumer>
);
