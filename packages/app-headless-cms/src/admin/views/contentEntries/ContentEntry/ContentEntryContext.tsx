import React, {
    Dispatch,
    MutableRefObject,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery } from "~/admin/hooks";
import { ContentEntriesContext } from "~/admin/views/contentEntries/ContentEntriesContext";
import { useContentEntries } from "~/admin/views/contentEntries/hooks/useContentEntries";
import { CmsContentEntry, CmsContentEntryRevision } from "~/types";
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
import { FormAPI, FormSubmitOptions } from "@webiny/form";

interface ContentEntryContextForm {
    submit: (
        ev: React.SyntheticEvent,
        options?: FormSubmitOptions
    ) => Promise<CmsContentEntry | null>;
}
type ContentEntryContextFormRef = MutableRefObject<ContentEntryContextForm>;
export interface ContentEntryContext extends ContentEntriesContext {
    createEntry: () => void;
    entry: CmsContentEntry;
    setEntry: (entry: CmsContentEntry) => void;
    form: ContentEntryContextFormRef;
    setFormRef: (form: Pick<FormAPI, "submit">) => void;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    revisions: CmsContentEntryRevision[];
    refetchContent: () => void;
    setActiveTab(index: number): void;
    activeTab: number;
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

export const ContentEntryProvider = ({
    children,
    isNewEntry,
    getContentId
}: ContentEntryContextProviderProps) => {
    const [activeTab, setActiveTab] = useState(0);
    const [entry, setEntry] = useState<CmsContentEntry>();
    const { contentModel, canCreate } = useContentEntries();

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

    useEffect(() => {
        if (!revisionId && entry) {
            setEntry(undefined);
        }
    }, [revisionId]);

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
        onCompleted: response => {
            if (!response) {
                return;
            }

            const { data, error } = response.content;
            if (!error) {
                setEntry(data);
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

    useEffect(() => {
        if (getRevisions.loading || !entryId) {
            return;
        }
        getRevisions.refetch({
            id: entryId
        });
    }, [revisionId, getRevisions]);

    const loading = isLoading || getEntry.loading || getRevisions.loading;

    const value: ContentEntryContext = {
        canCreate,
        contentModel,
        createEntry,
        entry: (entry || {}) as CmsContentEntry,
        setEntry,
        form: formRef,
        loading,
        revisions: get(getRevisions, "data.revisions.data") || [],
        refetchContent: getEntry.refetch,
        setFormRef,
        setLoading,
        setActiveTab,
        activeTab,
        showEmptyView: !newEntry && !loading && !revisionId
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

ContentEntryProvider.displayName = "ContentEntryProvider";
