import React, { useContext, useMemo, useState } from "react";
import { makeComposable, Compose, HigherOrderComponent } from "@webiny/app-admin";
import { Property, Properties, toObject } from "@webiny/react-properties";
import { Browser, BrowserConfig } from "./configComponents/Browser";
import { FileDetails, FileDetailsConfig } from "./configComponents/FileDetails";

const FileManagerViewConfigApply = makeComposable("FileManagerViewConfigApply", ({ children }) => {
    return <>{children}</>;
});

const createHOC =
    (newChildren: React.ReactNode): HigherOrderComponent =>
    BaseComponent => {
        return function ConfigHOC({ children }) {
            return (
                <BaseComponent>
                    {newChildren}
                    {children}
                </BaseComponent>
            );
        };
    };

export const FileManagerViewConfig = ({ children }: { children: React.ReactNode }) => {
    return <Compose component={FileManagerViewConfigApply} with={createHOC(children)} />;
};

FileManagerViewConfig.Browser = Browser;
FileManagerViewConfig.FileDetails = FileDetails;

interface ViewContext {
    properties: Property[];
}

const ViewContext = React.createContext<ViewContext>({ properties: [] });

export const FileManagerViewWithConfig = ({ children }: { children: React.ReactNode }) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const context = { properties };

    const stateUpdater = (properties: Property[]) => {
        setProperties(properties);
    };

    return (
        <ViewContext.Provider value={context}>
            <Properties onChange={stateUpdater}>
                <FileManagerViewConfigApply />
                {children}
            </Properties>
        </ViewContext.Provider>
    );
};

interface FileManagerViewConfigData {
    browser: BrowserConfig;
    fileDetails: FileDetailsConfig;
}

export function useFileManagerViewConfig() {
    const { properties } = useContext(ViewContext);

    const config = useMemo(() => {
        return toObject<FileManagerViewConfigData>(properties);
    }, [properties]);

    return {
        browser: config.browser || {},
        fileDetails: config.fileDetails || {
            width: "1000px"
        }
    };
}
