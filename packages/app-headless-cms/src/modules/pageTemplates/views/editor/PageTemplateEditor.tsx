import React from "react";
import { Editor } from "~/admin/components/ContentModelEditor/Editor";
import { useRouter } from "@webiny/react-router";
import { useCms } from "~/admin/hooks";
import { CmsModel } from "~/types";
import { EditorPlugins } from "./EditorPlugins";
import { ModelFieldPlugins } from "./ModelFieldPlugins";

type QueryMatch = Pick<Partial<CmsModel>, "modelId">;

const PageTemplateEditor: React.FC = () => {
    const { params } = useRouter();
    const { apolloClient } = useCms();

    const { modelId } = (params ? params : {}) as QueryMatch;
    if (!apolloClient || !modelId) {
        return null;
    }
    return (
        <ModelFieldPlugins>
            <EditorPlugins />
            <Editor modelId={modelId} apolloClient={apolloClient} />
        </ModelFieldPlugins>
    );
};

export default PageTemplateEditor;
