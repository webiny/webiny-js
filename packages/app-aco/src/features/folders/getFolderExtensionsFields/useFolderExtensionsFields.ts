import { useState, useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";
import { GetFolderExtensionsFieldsFeature } from "./feature.js";

export const useFolderExtensionsFields = () => {
    const { useCase } = useFeature(GetFolderExtensionsFieldsFeature);
    const [fields, setFields] = useState<CmsModelField[]>([]);

    useEffect(() => {
        useCase.execute().then(fields => {
            setFields(fields);
        });
    }, []);

    return { fields };
};
