import * as React from "react";
import { Theme, DisplayMode } from "~/types";

export const PageElementsContext = React.createContext(null);

// TODO: types
export interface Props {
    theme?: Theme;
    elements?: Record<string, any>;
    styles?: Array<Function>;
    attributes?: Array<Function>;
    displayModes?: Array<{
        name: string;
        maxWidth: number;
        minWidth: number;
    }>;
}

export interface PageElementsContextValue extends Props {
    responsiveDisplayMode: {
        displayMode: string;
        setDisplayMode: Function;
    };
}

export const PageElementsProvider: React.FC<Props> = ({
    children,
    theme = {},
    elements = {},
    styles = [],
    attributes = [],
    displayModes = []
}) => {
    const [displayMode, setDisplayMode] = React.useState(DisplayMode.DESKTOP);

    const value: PageElementsContextValue = {
        theme,
        elements,
        styles,
        attributes,
        displayModes,
        responsiveDisplayMode: {
            displayMode,
            setDisplayMode
        }
    };

    return <PageElementsContext.Provider value={value}>{children}</PageElementsContext.Provider>;
};

export const PageElementsConsumer = ({ children }) => (
    <PageElementsContext.Consumer>
        {props => React.cloneElement(children, { pageBuilder: props })}
    </PageElementsContext.Consumer>
);
