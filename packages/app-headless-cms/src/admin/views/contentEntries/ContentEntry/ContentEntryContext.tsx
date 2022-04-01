import React, {
    useRef,
    useState,
    useCallback,
    useMemo,
    Dispatch,
    SetStateAction,
    MutableRefObject
} from "react";
import isEmpty from "lodash/isEmpty";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useQuery } from "~/admin/hooks";
import { ContentEntriesContext } from "~/admin/views/contentEntries/ContentEntriesContext";
import { useContentEntries } from "~/admin/views/contentEntries/hooks/useContentEntries";
import { CmsContentEntryRevision, CmsEditorContentEntry, CmsEditorContentModel } from "~/types";
import { Tabs } from "@webiny/ui/Tabs";
import { parseIdentifier } from "@webiny/utils";
import {
    CmsEntriesListRevisionsQueryResponse,
    CmsEntriesListRevisionsQueryVariables,
    CmsEntryGetQueryResponse,
    CmsEntryGetQueryVariables,
    createReadQuery,
    createRevisionsQuery
} from "~/admin/graphql/contentEntries";

interface ContentEntryContextForm {
    submit: (ev: React.SyntheticEvent) => Promise<CmsEditorContentEntry | null>;
}
type ContentEntryContextFormRef = MutableRefObject<ContentEntryContextForm>;
type ContentEntryContextTabsRef = MutableRefObject<Tabs | null>;
export interface ContentEntryContext extends ContentEntriesContext {
    createEntry: () => void;
    entry: CmsEditorContentEntry;
    form: ContentEntryContextFormRef;
    setFormRef: (form: { submit: Function }) => void;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    revisions: CmsContentEntryRevision[];
    refetchContent: () => void;
    tabs: ContentEntryContextTabsRef;
    setTabsRef: (tabs: Tabs) => void;
    showEmptyView: boolean;
}

export const Context = React.createContext<ContentEntryContext>({
    createEntry: () => {
        return void 0;
    },
    entry: null as unknown as CmsEditorContentEntry,
    form: {
        current: {
            submit: async () => {
                return null;
            }
        }
    },
    canCreate: false,
    showEmptyView: false,
    tabs: {
        current: null
    },
    setTabsRef: () => {
        return void 0;
    },
    refetchContent: () => {
        return void 0;
    },
    revisions: [],
    setLoading: () => {
        return void 0;
    },
    loading: false,
    listQueryVariables: {},
    setListQueryVariables: () => {
        return void 0;
    },
    contentModel: null as unknown as CmsEditorContentModel,
    sorters: [],
    setFormRef: () => {
        return void 0;
    }
});

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

export const Provider: React.FC<ContentEntryContextProviderProps> = ({
    children,
    isNewEntry,
    getContentId
}) => {
    const { contentModel, canCreate, listQueryVariables, setListQueryVariables, sorters } =
        useContentEntries();

    const formRef = useRef<ContentEntryContextForm>({
        submit: async () => {
            return null;
        }
    });
    const tabsRef = useRef<Tabs | null>(null);
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
    if (revisionId) {
        const result = parseIdentifier(revisionId);
        entryId = result ? result.id : null;
    }

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

    const setTabsRef = useCallback(
        (tabs: Tabs) => {
            tabsRef.current = tabs;
        },
        [tabsRef]
    );

    const createEntry = useCallback((): void => {
        history.push(`/cms/content-entries/${contentModel.modelId}?new=true`);
    }, [contentModel.modelId]);

    const getEntry = useQuery<CmsEntryGetQueryResponse, CmsEntryGetQueryVariables>(READ_CONTENT, {
        variables: {
            revision: revisionId || ""
        },
        skip: !revisionId,
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
    const entry: CmsEditorContentEntry = get(getEntry, "data.content.data") || {};

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
        setTabsRef,
        showEmptyView: !newEntry && !loading && isEmpty(entry),
        tabs: tabsRef
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.displayName = "ContentEntryProvider";
