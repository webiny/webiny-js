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
import { Form } from "@webiny/form";
import * as GQL from "~/admin/graphql/contentEntries";
import { useQuery } from "~/admin/hooks";
import { ContentEntriesContext } from "~/admin/views/contentEntries/ContentEntriesContext";
import { useContentEntries } from "~/admin/views/contentEntries/hooks/useContentEntries";
import { CmsContentEntryRevision, CmsEditorContentEntry } from "~/types";
import { Tabs } from "@webiny/ui/Tabs";

export interface ContentEntryContext extends ContentEntriesContext {
    createEntry: () => void;
    entry: CmsEditorContentEntry;
    form: MutableRefObject<Form>;
    setFormRef: (form: Form) => void;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    revisions: CmsContentEntryRevision[];
    refetchContent: () => void;
    tabs: MutableRefObject<Tabs>;
    setTabsRef: (tabs: Tabs) => void;
    showEmptyView: boolean;
}

export const Context = React.createContext<ContentEntryContext>(null);

export const Provider = ({ children }) => {
    const {
        contentModel,
        canCreate,
        listQueryVariables,
        setListQueryVariables,
        sorters
    } = useContentEntries();

    const formRef = useRef(null);
    const tabsRef = useRef(null);
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();
    const [isLoading, setLoading] = useState(false);

    const newEntry = new URLSearchParams(location.search).get("new") === "true";
    const query = new URLSearchParams(location.search);
    const contentId = query.get("id");
    const revisionId = contentId ? decodeURIComponent(contentId) : null;
    const entryId = revisionId ? revisionId.split("#")[0] : null;

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
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.content;
            if (error) {
                history.push(`/cms/content-entries/${contentModel.modelId}`);
                showSnackbar(error.message);
            }
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
