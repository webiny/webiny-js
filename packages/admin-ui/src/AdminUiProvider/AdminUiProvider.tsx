import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Toast } from "~/Toast/index.js";
import { Tooltip } from "~/Tooltip/index.js";
import { type LinkComponent, DefaultLinkComponent } from "~/index.js";
import { defaultFileUrlFormatter, type FileUrlFormatter } from "./FileUrlFormatter.js";

export type CompileMarkdown = (markdown: React.ReactNode) => React.ReactNode;

export interface AdminUiContextValue {
    linkComponent: LinkComponent;
    compileMarkdown: CompileMarkdown;
    fileUrlFormatter: FileUrlFormatter;
}

const passthrough = (markdown: string) => markdown;

export const AdminUiContext = React.createContext<AdminUiContextValue | undefined>(undefined);

interface MarkdownCompiler {
    (markdown: string): React.ReactNode;
}

export interface AdminUiProviderProps {
    linkComponent?: LinkComponent;
    markdownCompiler?: MarkdownCompiler;
    fileUrlFormatter?: FileUrlFormatter;
    children: React.ReactNode;
}

export const AdminUiProvider = ({ children, ...props }: AdminUiProviderProps) => {
    const linkComponent = props.linkComponent ?? DefaultLinkComponent;
    const markdownCompiler = props.markdownCompiler ?? passthrough;
    const fileUrlFormatter = props.fileUrlFormatter ?? defaultFileUrlFormatter;

    // Cache to store compiled markdown results
    const cacheRef = useRef(new Map<string, React.ReactNode>());

    // Clear cache when markdownCompiler changes
    useEffect(() => {
        cacheRef.current.clear();
    }, [markdownCompiler]);

    const compileMarkdown = useCallback(
        (markdown: React.ReactNode) => {
            if (!markdownCompiler) {
                return markdown;
            }

            if (React.isValidElement(markdown)) {
                return markdown;
            }

            if (typeof markdown === "string") {
                const cached = cacheRef.current.get(markdown);
                if (cached !== undefined) {
                    return cached;
                }

                const compiled = markdownCompiler(markdown);
                cacheRef.current.set(markdown, compiled);
                return compiled;
            }

            return markdown;
        },
        [markdownCompiler]
    );

    const contextValue = useMemo(
        () => ({ linkComponent, compileMarkdown, fileUrlFormatter }),
        [linkComponent, compileMarkdown, fileUrlFormatter]
    );

    return (
        <AdminUiContext.Provider value={contextValue}>
            <Tooltip.Provider>{children}</Tooltip.Provider>
            <Toast.Provider />
        </AdminUiContext.Provider>
    );
};

export const useAdminUi = () => {
    const context = React.useContext(AdminUiContext);
    if (!context) {
        throw new Error("AdminUiProvider is missing from the component tree.");
    }
    return context;
};
