import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { useFeature } from "@webiny/app";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { RevisionListFeature } from "~/presentation/pages/RevisionList/feature.js";

export const useRevisionList = (pageId: string) => {
    const { presenter } = useFeature(RevisionListFeature);

    const { id: entryId } = useMemo(() => parseIdentifier(pageId), [pageId]);

    useEffect(() => {
        presenter.init({ entryId });
    }, [entryId, presenter]);

    const [vm, setVm] = useState(presenter.vm);

    useEffect(() => {
        return autorun(() => {
            setVm(presenter.vm);
        });
    }, [presenter]);

    return { vm };
};
