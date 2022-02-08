import React, { useMemo, useRef } from "react";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { PbPageData, PbPageRevision } from "~/types";
import { AsyncProcessor, composeAsync } from "./compose";
import { PageBuilderContextValue } from "~/contexts/PageBuilder";

export const AdminPageBuilderContext = React.createContext(null);

interface Page extends Pick<PbPageData, "path" | "content">, PbPageRevision {}

export interface AdminPageBuilderContextValue extends PageBuilderContextValue {
    publishPage: (page: Page) => Promise<OnPagePublish>;
    onPagePublish: (fn: OnPagePublishSubscriber) => () => void;
}

type OnPagePublishSubscriber = AsyncProcessor<OnPagePublish>;

interface OnPagePublish {
    page: Page;
    // TODO: Maybe a different input and output type for compose.
    error?: {
        message: string;
        code: string;
        data: Record<string, any>;
    };
}

export const AdminPageBuilderContextProvider: React.FC = ({ children }) => {
    const pageBuilder = usePageBuilder();
    const onPagePublish = useRef<OnPagePublishSubscriber[]>([]);

    const context: AdminPageBuilderContextValue = useMemo(() => {
        return {
            ...pageBuilder,
            async publishPage(page) {
                return await composeAsync([...onPagePublish.current].reverse())({
                    page
                });
            },
            onPagePublish: (fn: OnPagePublishSubscriber) => {
                onPagePublish.current.push(fn);
                return () => {
                    const index = onPagePublish.current.length;
                    onPagePublish.current.splice(index, 1);
                };
            }
        };
    }, [pageBuilder]);

    return (
        <AdminPageBuilderContext.Provider value={context}>
            {children}
        </AdminPageBuilderContext.Provider>
    );
};
