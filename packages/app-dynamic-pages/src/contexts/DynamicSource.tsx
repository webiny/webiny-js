import React, { createContext } from "react";
import { useDynamicDataForEditor, useDynamicData } from "~/hooks/useDynamicData";
import { useIsDynamicElement } from "~/hooks/useIsDynamicElement";
import { PbElement } from "~/types";

export interface DynamicSourceContext {
    data: any;
    modelId: string;
    refreshDynamicContainer?: () => void;
}

export const DynamicSourceContext = createContext<DynamicSourceContext | undefined>(undefined);

type DynamicSourceProviderProps = {
    children: React.ReactNode;
    element?: PbElement;
    refreshDynamicContainer?: () => void;
    templateWhereField?: Record<string, string>;
};

export const DynamicSourceProvider: React.FC<DynamicSourceProviderProps> = ({
    children,
    element
}) => {
    const isDynamic = useIsDynamicElement(element);
    const { data } = useDynamicData(element);

    if (isDynamic) {
        return (
            <>
                {data?.map((dynamicSource, index) => {
                    const value: DynamicSourceContext = {
                        data: dynamicSource,
                        modelId: element?.data?.dynamicSource?.modelId
                    };

                    return (
                        <DynamicSourceContext.Provider key={index} value={value}>
                            {children}
                        </DynamicSourceContext.Provider>
                    );
                })}
            </>
        );
    }

    return <>{children}</>;
};

export const EditorDynamicSourceProvider: React.FC<DynamicSourceProviderProps> = ({
    children,
    element,
    refreshDynamicContainer,
    templateWhereField
}) => {
    const isDynamic = useIsDynamicElement(element);
    const { data } = useDynamicDataForEditor(element, templateWhereField);

    if (isDynamic) {
        const value: DynamicSourceContext = {
            data,
            modelId: element?.data?.dynamicSource?.modelId,
            refreshDynamicContainer
        };

        return (
            <DynamicSourceContext.Provider value={value}>{children}</DynamicSourceContext.Provider>
        );
    }

    return <>{children}</>;
};
