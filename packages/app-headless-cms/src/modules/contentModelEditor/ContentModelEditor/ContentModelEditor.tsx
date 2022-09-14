import React from "react";
import { Editor } from "~/modelEditor";
import { useRouter } from "@webiny/react-router";
import { useCms } from "~/admin/hooks";
import { CmsModel } from "~/types";
import { ContentModelEditorConfig } from "./ContentModelEditorConfig";

type QueryMatch = Pick<Partial<CmsModel>, "modelId">;

export const ContentModelEditor: React.FC = () => {
    const { params } = useRouter();
    const { apolloClient } = useCms();

    const { modelId } = (params ? params : {}) as QueryMatch;
    if (!apolloClient || !modelId) {
        return null;
    }
    return (
        <>
            <ContentModelEditorConfig />
            <Editor modelId={modelId} apolloClient={apolloClient} />
        </>
    );
};
