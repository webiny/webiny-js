import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { AutoComplete, MultiAutoComplete, Select, Input } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import type {
    ContentEntryInput,
    ContentEntryReference,
    ContentEntryQueryValue
} from "@webiny/website-builder-sdk";
import { RefSingleAutocompletePresenterFeature } from "@webiny/app-headless-cms/presentation/fieldRenderers/ref/autocomplete/single/feature.js";
import { RefMultiAutocompletePresenterFeature } from "@webiny/app-headless-cms/presentation/fieldRenderers/ref/autocomplete/multi/feature.js";

/**
 * Editor sidebar renderer for the `contentEntry` input. Supports two modes:
 *
 * - "manual" (default): the editor hand-picks one (single) or several (list)
 *   CMS entries from the input's author-fixed model(s), stored as references
 *   (`{ id, modelId }`). Reuses the Headless CMS reference autocomplete.
 * - "query": the editor configures a dynamic query (sort / limit / search)
 *   within the bounds the component author declared on `input.query`.
 */
export const ContentEntryInputRenderer = (props: ElementInputRendererProps) => {
    const input = props.input as ContentEntryInput;

    if (input.mode === "query") {
        return <QueryInner {...props} />;
    }

    return <ManualRenderer {...props} />;
};

// --- Manual mode -----------------------------------------------------------

const ManualRenderer = (props: ElementInputRendererProps) => {
    const input = props.input as ContentEntryInput;
    const parentContainer = useContainer();

    const scopedContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        if (input.list) {
            RefMultiAutocompletePresenterFeature.register(child);
        } else {
            RefSingleAutocompletePresenterFeature.register(child);
        }
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            {input.list ? <MultiInner {...props} /> : <SingleInner {...props} />}
        </DiContainerProvider>
    );
};

const SingleInner = observer(({ value, onChange, ...props }: ElementInputRendererProps) => {
    const input = props.input as ContentEntryInput;
    const { presenter } = useFeature(RefSingleAutocompletePresenterFeature);

    const current = (value as ContentEntryReference | null | undefined) ?? null;

    useEffect(() => {
        presenter.init({ modelIds: input.models, value: current });
    }, []);

    const vm = presenter.vm;

    return (
        <AutoComplete
            label={input.label}
            description={input.description}
            loading={vm.loading}
            value={vm.value}
            options={vm.options}
            onValueSearch={query => presenter.search(query)}
            onValueChange={selectedEntryId => {
                if (!selectedEntryId) {
                    presenter.clear();
                    onChange(({ value }) => value.set(null));
                    return;
                }
                const ref = presenter.select(selectedEntryId);
                onChange(({ value }) => value.set(ref));
            }}
            onValueReset={() => {
                presenter.clear();
                onChange(({ value }) => value.set(null));
            }}
            displayResetAction={vm.canReset}
        />
    );
});

const MultiInner = observer(({ value, onChange, ...props }: ElementInputRendererProps) => {
    const input = props.input as ContentEntryInput;
    const { presenter } = useFeature(RefMultiAutocompletePresenterFeature);

    const current: ContentEntryReference[] = Array.isArray(value) ? value : [];

    useEffect(() => {
        presenter.init({ modelIds: input.models, values: current });
    }, []);

    const vm = presenter.vm;

    return (
        <MultiAutoComplete
            label={input.label}
            description={input.description}
            loading={vm.loading}
            values={vm.values}
            options={vm.options}
            uniqueValues
            onValueSearch={query => presenter.search(query)}
            onValuesChange={entryIds => {
                const refs = presenter.select(entryIds);
                onChange(({ value }) => value.set(refs.length > 0 ? refs : null));
            }}
            onValuesReset={() => {
                presenter.clear();
                onChange(({ value }) => value.set(null));
            }}
        />
    );
});

// --- Query mode ------------------------------------------------------------

const SORT_DIRECTION_OPTIONS = [
    { label: "Ascending", value: "asc" },
    { label: "Descending", value: "desc" }
];

const QueryInner = ({ value, onChange, ...props }: ElementInputRendererProps) => {
    const input = props.input as ContentEntryInput;
    const config = input.query ?? {};
    const current = (value as ContentEntryQueryValue | undefined) ?? {};

    const sortFields = config.sort?.fields ?? [];
    const [searchText, setSearchText] = useState(current.search ?? "");

    const update = (patch: Partial<ContentEntryQueryValue>) => {
        onChange(({ value }) => {
            value.set({ ...current, ...patch });
        });
    };

    return (
        <div className={"flex flex-col gap-md"}>
            {sortFields.length > 0 ? (
                <>
                    <Select
                        size={"md"}
                        variant={"secondary"}
                        label={"Sort by"}
                        value={current.sort?.field}
                        options={sortFields.map(field => ({ label: field, value: field }))}
                        displayResetAction
                        onChange={field => {
                            update({
                                sort: field
                                    ? { field, order: current.sort?.order ?? "asc" }
                                    : undefined
                            });
                        }}
                    />
                    {current.sort?.field ? (
                        <Select
                            size={"md"}
                            variant={"secondary"}
                            label={"Direction"}
                            value={current.sort?.order ?? "asc"}
                            options={SORT_DIRECTION_OPTIONS}
                            onChange={order => {
                                update({
                                    sort: {
                                        field: current.sort!.field,
                                        order: (order as "asc" | "desc") ?? "asc"
                                    }
                                });
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            {config.limit ? (
                <Input
                    type={"number"}
                    size={"md"}
                    variant={"secondary"}
                    label={"Limit"}
                    value={current.limit ?? config.limit.default}
                    onChange={raw => {
                        const parsed = parseInt(raw, 10);
                        if (isNaN(parsed)) {
                            return;
                        }
                        const max = config.limit?.max;
                        update({ limit: max ? Math.min(parsed, max) : parsed });
                    }}
                />
            ) : null}

            {config.search ? (
                <Input
                    size={"md"}
                    variant={"secondary"}
                    label={"Search"}
                    value={searchText}
                    onChange={setSearchText}
                    onBlur={e => update({ search: e.currentTarget.value })}
                    onEnter={e => update({ search: e.currentTarget.value })}
                />
            ) : null}
        </div>
    );
};
