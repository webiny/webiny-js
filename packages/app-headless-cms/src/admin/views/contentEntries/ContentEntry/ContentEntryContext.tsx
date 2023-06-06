import React, {
    useRef,
    useState,
    useCallback,
    useMemo,
    Dispatch,
    SetStateAction,
    MutableRefObject,
    RefObject
} from "react";
import isEmpty from "lodash/isEmpty";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery } from "~/admin/hooks";
import { ContentEntriesContext } from "~/admin/views/contentEntries/ContentEntriesContext";
import { useContentEntries } from "~/admin/views/contentEntries/hooks/useContentEntries";
import { CmsContentEntryRevision, CmsContentEntry } from "~/types";
import { TabsImperativeApi } from "@webiny/ui/Tabs";
import { parseIdentifier } from "@webiny/utils";
import {
    CmsEntriesListRevisionsQueryResponse,
    CmsEntriesListRevisionsQueryVariables,
    CmsEntryGetQueryResponse,
    CmsEntryGetQueryVariables,
    createReadQuery,
    createRevisionsQuery
} from "@webiny/app-headless-cms-common";
import { getFetchPolicy } from "~/utils/getFetchPolicy";

interface ContentEntryContextForm {
    submit: (ev: React.SyntheticEvent) => Promise<CmsContentEntry | null>;
}
type ContentEntryContextFormRef = MutableRefObject<ContentEntryContextForm>;
export interface ContentEntryContext extends ContentEntriesContext {
    createEntry: () => void;
    entry: CmsContentEntry;
    form: ContentEntryContextFormRef;
    setFormRef: (form: { submit: Function }) => void;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    revisions: CmsContentEntryRevision[];
    refetchContent: () => void;
    tabsRef: RefObject<TabsImperativeApi | undefined>;
    showEmptyView: boolean;
}

export const Context = React.createContext<ContentEntryContext | undefined>(undefined);

export interface ContentEntryContextProviderProps extends Partial<UseContentEntryProviderProps> {
    children: React.ReactNode;
}

interface UseContentEntryProviderProps {
    getContentId: () => string | null;
    isNewEntry: () => boolean;
}

export const useContentEntryProviderProps = (): UseContentEntryProviderProps => {
    const { location } = useRouter();
    const query = new URLSearchParams(location.search);

    const isNewEntry = (): boolean => {
        return query.get("new") === "true";
    };

    const getContentId = (): string | null => {
        return query.get("id") || null;
    };

    return {
        getContentId,
        isNewEntry
    };
};

export const ContentEntryProvider: React.FC<ContentEntryContextProviderProps> = ({
    children,
    isNewEntry,
    getContentId
}) => {
    const { contentModel, canCreate, listQueryVariables, setListQueryVariables, sorters } =
        useContentEntries();

    const { search } = useRouter();
    const [query] = search;

    const formRef = useRef<ContentEntryContextForm>({
        submit: async () => {
            return null;
        }
    });
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [isLoading, setLoading] = useState<boolean>(false);

    const contentEntryProviderProps = useContentEntryProviderProps();

    const newEntry =
        typeof isNewEntry === "function" ? isNewEntry() : contentEntryProviderProps.isNewEntry();
    const contentId =
        typeof getContentId === "function"
            ? getContentId()
            : contentEntryProviderProps.getContentId();

    const revisionId = contentId ? decodeURIComponent(contentId) : null;
    let entryId: string | null = null;
    let version: number | null = null;
    if (revisionId) {
        const result = parseIdentifier(revisionId);
        entryId = result.id;
        version = result.version;
    }

    const tabsRef = useRef<TabsImperativeApi>();

    const { READ_CONTENT } = useMemo(() => {
        return {
            READ_CONTENT: createReadQuery(contentModel)
        };
    }, [contentModel.modelId]);

    const { GET_REVISIONS } = useMemo(() => {
        return {
            GET_REVISIONS: createRevisionsQuery(contentModel)
        };
    }, [contentModel.modelId]);

    const setFormRef = useCallback(
        form => {
            formRef.current = form;
        },
        [formRef]
    );

    const folderIdPath = useMemo(() => {
        const folderId = query.get("folderId");
        if (!folderId) {
            return "";
        }
        return `&folderId=${encodeURIComponent(folderId)}`;
    }, [query]);

    const createEntry = useCallback((): void => {
        history.push(`/cms/content-entries/${contentModel.modelId}?new=true${folderIdPath}`);
    }, [contentModel.modelId, folderIdPath]);

    let variables: CmsEntryGetQueryVariables | undefined;
    if (version === null && entryId) {
        variables = {
            entryId
        };
    } else {
        variables = {
            revision: revisionId as string
        };
    }

    const getEntry = useQuery<CmsEntryGetQueryResponse, CmsEntryGetQueryVariables>(READ_CONTENT, {
        variables,
        skip: !revisionId,
        fetchPolicy: getFetchPolicy(contentModel),
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.content;
            if (!error) {
                return;
            }
            history.push(`/cms/content-entries/${contentModel.modelId}`);
            showSnackbar(error.message);
        }
    });

    const getRevisions = useQuery<
        CmsEntriesListRevisionsQueryResponse,
        CmsEntriesListRevisionsQueryVariables
    >(GET_REVISIONS, {
        variables: {
            id: entryId as string
        },
        skip: !entryId
    });

    const loading = isLoading || getEntry.loading || getRevisions.loading;
    const entry = (get(getEntry, "data.content.data") as unknown as CmsContentEntry) || {};

    const value: ContentEntryContext = {
        canCreate,
        contentModel,
        createEntry,
        listQueryVariables,
        setListQueryVariables,
        sorters,
        entry,
        form: formRef,
        loading,
        revisions: get(getRevisions, "data.revisions.data") || [],
        refetchContent: getEntry.refetch,
        setFormRef,
        setLoading,
        tabsRef,
        showEmptyView: !newEntry && !loading && isEmpty(entry)
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

ContentEntryProvider.displayName = "ContentEntryProvider";
