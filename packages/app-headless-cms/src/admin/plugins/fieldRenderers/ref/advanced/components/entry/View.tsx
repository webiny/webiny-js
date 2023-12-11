import React from "react";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ReactComponent as ViewIcon } from "./assets/view.svg";
import { ButtonLink } from "./elements/ButtonLink";

const createEntryUrl = (entry: CmsReferenceContentEntry) => {
    const folderId = entry.wbyAco_location?.folderId || "";
    return `/cms/content-entries/${entry.model.modelId}?id=${
        entry.id
    }&folderId=${encodeURIComponent(folderId)}`;
};

interface ViewProps {
    entry: CmsReferenceContentEntry;
}
export const View = ({ entry }: ViewProps) => {
    return (
        <ButtonLink href={createEntryUrl(entry)} target="_blank" maxWidth={"95px"}>
            <ViewIcon /> <span>View</span>
        </ButtonLink>
    );
};
