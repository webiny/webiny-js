import React from "react";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as ViewListIcon } from "~/admin/icons/view_list.svg";
import {
    GET_CONTENT_MODEL,
    GetCmsModelQueryResponse,
    GetCmsModelQueryVariables
} from "~/admin/graphql/contentModels";
import { useModelEditor } from "~/admin/hooks";

const t = i18n.namespace("app-headless-cms/admin/editor/top-bar/save-button");

const CreateContentButton = () => {
    const router = useRouter();
    const { data, apolloClient } = useModelEditor();

    const getQuery = apolloClient.readQuery<GetCmsModelQueryResponse, GetCmsModelQueryVariables>({
        query: GET_CONTENT_MODEL,
        variables: {
            modelId: data.modelId
        }
    });
    const fields = get(getQuery, "getContentModel.data.fields", []);
    const disableViewContent = fields.length === 0;
    const message = disableViewContent
        ? "To view the content, you first need to add a field and save the form"
        : "View content";

    return (
        <Tooltip content={t`{message}`({ message })} placement={"bottom"}>
            <IconButton
                icon={<ViewListIcon />}
                onClick={() => router.history.push(`/cms/content-entries/${data.modelId}`)}
                disabled={disableViewContent}
            />
        </Tooltip>
    );
};

export default CreateContentButton;
