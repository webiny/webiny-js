import React from "react";
import { createProviderPlugin } from "@webiny/app-admin";
import { OverlayLoader } from "@webiny/admin-ui";
import { Company } from "@demo/tenant-management-shared";
import { useCurrentCompanyQuery } from "./useCurrentCompanyQuery";

export interface CurrentCompany {
    company: Company;
}

const CurrentCompanyContext = React.createContext<CurrentCompany | undefined>(undefined);

interface CurrentCompanyProps {
    children: React.ReactNode;
}

const CurrentCompany = ({ children }: CurrentCompanyProps) => {
    const { loading, company, error } = useCurrentCompanyQuery();

    if (loading) {
        return <OverlayLoader title={"Loading company..."} />;
    }

    if (error) {
        return <OverlayLoader title={error.message} />;
    }

    if (!company) {
        return <OverlayLoader title={"Unable to load company!"} />;
    }

    return (
        <CurrentCompanyContext.Provider value={{ company }}>
            {children}
        </CurrentCompanyContext.Provider>
    );
};

export const CurrentCompanyProvider = createProviderPlugin(Component => {
    return function CurrentCompanyProvider({ children }) {
        return (
            <CurrentCompany>
                <Component>
                    {children}
                </Component>
            </CurrentCompany>
        );
    };
});

export function useCurrentCompany() {
    const context = React.useContext(CurrentCompanyContext);

    if (!context) {
        throw Error(`Missing CurrentCompanyProvider in the component hierarchy!`);
    }

    return context;
}
