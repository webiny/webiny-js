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
import * as GQL from "~/admin/graphql/contentEntries";
import { useQuery } from "~/admin/hooks";
import { ContentEntriesContext } from "~/admin/views/contentEntries/ContentEntriesContext";
import { useContentEntries } from "~/admin/views/contentEntries/hooks/useContentEntries";
import { CmsContentEntryRevision, CmsEditorContentEntry } from "~/types";
import { Tabs } from "@webiny/ui/Tabs";
import { parseIdentifier } from "@webiny/utils";

interface EntryQueryData {
    content: {
        error?: {
            message: string;
            code: string;
            data: Record<string, any>;
        };
    };
}

export interface ContentEntryContext extends ContentEntriesContext {
    createEntry: () => void;
    entry: CmsEditorContentEntry;
    form: MutableRefObject<{ submit: Function }>;
    setFormRef: (form: { submit: Function }) => void;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    revisions: CmsContentEntryRevision[];
    refetchContent: () => void;
    tabs: MutableRefObject<Tabs>;
    setTabsRef: (tabs: Tabs) => void;
    showEmptyView: boolean;
}

export const Context = React.createContext<ContentEntryContext>(null);

export const Provider: React.FC = ({ children }) => {
export interface ContentEntryContextProviderProps extends GetContentEntryFormType {
    children: React.ReactNode;
}

interface GetContentEntryFormType {
    getContentId?: () => string | null;
    isNewEntry?: () => boolean;
}

export const useContentEntryProviderProps = (): GetContentEntryFormType => {
    const { location } = useRouter();
    const query = new URLSearchParams(location.search);

    const isNewEntry = () => {
        return query.get("new") === "true";
    };

    const getContentId = () => {
        return query.get("id");
    };

    return {
        getContentId,
        isNewEntry
    };
};

export const Provider = ({
    children,
    isNewEntry,
    getContentId
}: ContentEntryContextProviderProps) => {
    const { contentModel, canCreate, listQueryVariables, setListQueryVariables, sorters } =
        useContentEntries();

    const formRef = useRef(null);
    const tabsRef = useRef(null);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [isLoading, setLoading] = useState(false);

    const contentEntryProviderProps = useContentEntryProviderProps();

    const newEntry =
        typeof isNewEntry === "function" ? isNewEntry() : contentEntryProviderProps.isNewEntry();
    const contentId =
        typeof getContentId === "function"
            ? getContentId()
            : contentEntryProviderProps.getContentId();

    const revisionId = contentId ? decodeURIComponent(contentId) : null;
    let entryId = null;
    if (revisionId) {
        const result = parseIdentifier(revisionId);
        entryId = result ? result.id : null;
    }

    const { READ_CONTENT } = useMemo(() => {
        return {
            READ_CONTENT: GQL.createReadQuery(contentModel)
        };
    }, [contentModel.modelId]);

    const { GET_REVISIONS } = useMemo(() => {
        return {
            GET_REVISIONS: GQL.createRevisionsQuery(contentModel)
        };
    }, [contentModel.modelId]);

    const setFormRef = useCallback(
        form => {
            formRef.current = form;
        },
        [formRef]
    );

    const setTabsRef = useCallback(
        tabs => {
            tabsRef.current = tabs;
        },
        [tabsRef]
    );

    const createEntry = useCallback(() => {
        history.push(`/cms/content-entries/${contentModel.modelId}?new=true`);
    }, [contentModel.modelId]);

    const getEntry = useQuery(READ_CONTENT, {
        variables: { revision: decodeURIComponent(contentId) },
        skip: !contentId,
        onCompleted: (data?: EntryQueryData) => {
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

    const getRevisions = useQuery(GET_REVISIONS, {
        variables: { id: entryId },
        skip: !entryId
    });

    const loading = isLoading || getEntry.loading || getRevisions.loading;
    const entry = get(getEntry, "data.content.data") || {};

    const value = {
        canCreate,
        contentModel,
        createEntry,
        listQueryVariables,
        setListQueryVariables,
        sorters,
        entry,
        form: formRef,
        loading,
        revisions: get(getRevisions, "data.revisions.data") || {},
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
