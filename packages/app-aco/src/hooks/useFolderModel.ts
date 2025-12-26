import { useEffect } from "react";
import { useState } from "react";
import { useFeature } from "@webiny/app-admin";
import { CmsModel } from "@webiny/app-headless-cms-common/types";
import { FolderModelProviderFeature } from "~/features/folders/folderModelProvider/feature.js";

export function useFolderModel() {
    const { provider } = useFeature(FolderModelProviderFeature);
    const [model, setModel] = useState<CmsModel | null>(null);

    useEffect(() => {
        provider.getModel().then(model => {
            setModel(model);
        });
    }, []);

    return model;
}
