import * as React from "react";

type WidgetActionsLocation = "header" | "footer-start" | "footer-end";

const WidgetActionsContext = React.createContext<WidgetActionsLocation | undefined>(undefined);

interface WidgetActionsProviderProps {
    location: WidgetActionsLocation;
    children: React.ReactNode;
}

export const WidgetActionsProvider = ({ location, children }: WidgetActionsProviderProps) => {
    return (
        <WidgetActionsContext.Provider value={location}>{children}</WidgetActionsContext.Provider>
    );
};

export const useWidgetActionsLocation = () => {
    return React.useContext(WidgetActionsContext);
};
