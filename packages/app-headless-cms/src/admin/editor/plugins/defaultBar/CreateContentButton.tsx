import React, { useState } from "react";
import { ButtonDefault } from "@webiny/ui/Button";
import useReactRouter from "use-react-router";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("app-headless-cms/admin/editor/top-bar/save-button");

const CreateContentButton = () => {
    const [loading] = useState(false);
    const router = useReactRouter();
    const { data } = useContentModelEditor();

    return (
        <ButtonDefault
            onClick={() => router.history.push(`/cms/content-models/manage/${data.modelId}`)}
            style={{ marginLeft: 5 }}
            disabled={loading}
        >
            {t`View content`}
        </ButtonDefault>
    );
};

export default CreateContentButton;
