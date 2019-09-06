import * as React from "react";
import { useContext } from "react";
import { PageBuilderContext } from "../context";

type UsePageBuilderHookType = {
    theme: Object,
    isEditor?: boolean,
    defaults?: {
        pages?: {
            notFound?: React.ComponentType<any>,
            error?: React.ComponentType<any>
        }
    }
};

export function usePageBuilder(): UsePageBuilderHookType {
    return useContext(PageBuilderContext);
}