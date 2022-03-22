import React from "react";
import debounce from "lodash/debounce";
import NewRefEntryFormDialog, { NewEntryButton } from "./NewRefEntryFormDialog";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { i18n } from "@webiny/app/i18n";
import { Link } from "@webiny/react-router";
import { useNewRefEntry } from "../hooks/useNewRefEntry";
import { useReference } from "./useReference";
import { renderItem } from "./renderItem";
import { createEntryUrl } from "./createEntryUrl";
import { CmsContentEntryStatusType, CmsEditorField } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";
import styled from "@emotion/styled";
import { ReactComponent as PublishedIcon } from "~/admin/icons/published.svg";
import { ReactComponent as UnpublishedIcon } from "~/admin/icons/unpublished.svg";
import { ReactComponent as DraftIcon } from "~/admin/icons/draft.svg";
import { OptionItem } from "./types";
import { Tooltip } from "@webiny/ui/Tooltip";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

const unpublishedLabel = t`Selected content entry is not published. Make sure to {publishItLink} before publishing the main content entry.`;
const publishedLabel = t`Selected content entry is published. You can view it {here}.`;

const EntryStatusWrapper = styled("div")({
    display: "table"
});
const EntryStatusTooltip = styled("div")({
    display: "table-cell",
    width: "30px",
    verticalAlign: "middle"
});
const EntryStatusText = styled("div")({
    display: "table-cell",
    verticalAlign: "middle"
});

const getItemOption = (options: OptionItem[], id?: string | null): OptionItem | null => {
    if (!id || !options || options.length === 0) {
        return null;
    }
    const [entryId] = id.split("#");
    return options.find(item => item.entryId === entryId) || null;
};

const getEntryStatus = (item: OptionItem): CmsContentEntryStatusType => {
    if (item.status === "published") {
        return "published";
    } else if (item.status === "unpublished" || (!item.published && item.status === "draft")) {
        return "unpublished";
    }
    return "draft";
};

interface EntryStatusProps {
    item: OptionItem | null;
}
const EntryStatus: React.FC<EntryStatusProps> = ({ item, children }) => {
    if (!item) {
        return <>{children}</>;
    }
    const status = getEntryStatus(item);
    const tooltipText = getItemStatusText(item);

    const published = status === "published";
    const unpublished = status === "unpublished";
    return (
        <EntryStatusWrapper>
            <EntryStatusTooltip>
                <Tooltip content={tooltipText} placement={"bottom"}>
                    {published && <PublishedIcon />}
                    {unpublished && <UnpublishedIcon />}
                    {!published && !unpublished && <DraftIcon />}
                </Tooltip>
            </EntryStatusTooltip>
            <EntryStatusText>{children}</EntryStatusText>
        </EntryStatusWrapper>
    );
};

const getItemStatusText = (item: OptionItem): string => {
    const status = getEntryStatus(item);
    switch (status) {
        case "published":
            return "This entry is published.";
        case "unpublished":
            return "This entry has not been published.";
        default:
            return "Latest revision of this entry is in draft stage.";
    }
};

interface ContentEntriesAutocompleteProps {
    bind: BindComponentRenderProp;
    field: CmsEditorField;
}
const ContentEntriesAutocomplete: React.FC<ContentEntriesAutocompleteProps> = ({ bind, field }) => {
    const { options, setSearch, value, loading, onChange } = useReference({
        bind,
        field
    });

    let entryInfo: string | null = null;
    if (value && !value.published) {
        const link = createEntryUrl(value);
        entryInfo = unpublishedLabel({ publishItLink: <Link to={link}>{t`publish it`}</Link> });
    } else if (value) {
        const link = createEntryUrl(value);
        entryInfo = publishedLabel({
            here: <Link to={link}>{t`here`}</Link>
        });
    }
    const { renderNewEntryModal, refModelId, helpText } = useNewRefEntry({ field });

    const item = getItemOption(options, bind.value ? bind.value.id : null);
    /*
     * Wrap AutoComplete input in NewRefEntry modal.
     */
    if (renderNewEntryModal) {
        return (
            <NewRefEntryFormDialog
                modelId={refModelId}
                onChange={entry => {
                    /**
                     * TODO @ts-refactor @ashutosh
                     * Need to figure out correct types.
                     */
                    // @ts-ignore
                    return onChange(entry, entry);
                }}
            >
                <AutoComplete
                    {...bind}
                    renderItem={renderItem}
                    onChange={onChange}
                    loading={loading}
                    value={value || undefined}
                    options={options}
                    label={field.label}
                    description={
                        <>
                            {field.helpText}
                            <EntryStatus item={item}>{entryInfo}</EntryStatus>
                        </>
                    }
                    onInput={debounce(search => setSearch(search), 250)}
                    noResultFound={<NewEntryButton />}
                />
            </NewRefEntryFormDialog>
        );
    }

    return (
        <AutoComplete
            {...bind}
            renderItem={renderItem}
            onChange={onChange}
            loading={loading}
            value={value || undefined}
            options={options}
            label={field.label}
            description={
                <>
                    {field.helpText}
                    <EntryStatus item={item}>{entryInfo}</EntryStatus>
                </>
            }
            onInput={debounce(search => setSearch(search), 250)}
            noResultFound={helpText}
        />
    );
};

export default ContentEntriesAutocomplete;
