import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { AutoComplete, Select, Input, SegmentedControl } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import type {
    ContentEntryInput,
    ContentEntryReference,
    ContentEntryQueryValue
} from "@webiny/website-builder-sdk";
import { RefSingleAutocompletePresenterFeature } from "@webiny/app-headless-cms/presentation/fieldRenderers/ref/autocomplete/single/feature.js";
import { RefMultiAutocompletePresenterFeature } from "@webiny/app-headless-cms/presentation/fieldRenderers/ref/autocomplete/multi/feature.js";
import { ObjectRow } from "~/inputRenderers/ObjectInput/ObjectRow.js";
import { ObjectRowActions } from "~/inputRenderers/ObjectInput/ObjectRowActions.js";

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
    // Bumping this remounts the AutoComplete, clearing its search text after a pick.
    const [pickerKey, setPickerKey] = useState(0);

    useEffect(() => {
        presenter.init({ modelIds: input.models, values: current });
    }, []);

    const vm = presenter.vm;
    const labelFor = (entryId: string) =>
        vm.options.find(option => option.value === entryId)?.label ?? entryId;

    const setSelection = (entryIds: string[]) => {
        const refs = presenter.select(entryIds);
        onChange(({ value }) => value.set(refs.length > 0 ? refs : null));
    };

    const moveItem = (from: number, to: number) => {
        if (to < 0 || to >= vm.values.length) {
            return;
        }
        const next = [...vm.values];
        [next[from], next[to]] = [next[to], next[from]];
        setSelection(next);
    };

    return (
        <div className={"flex flex-col gap-sm"}>
            {/* Picker: a single autocomplete that adds the chosen entry to the list below,
                then remounts (via pickerKey) so its search input clears. */}
            <AutoComplete
                key={pickerKey}
                label={input.label}
                description={input.description}
                loading={vm.loading}
                value={undefined}
                options={vm.options.filter(option => !vm.values.includes(option.value))}
                onValueSearch={query => presenter.search(query)}
                onValueChange={entryId => {
                    if (entryId && !vm.values.includes(entryId)) {
                        setSelection([...vm.values, entryId]);
                        setPickerKey(key => key + 1);
                    }
                }}
            />
            {/* Selected entries as reorderable rows (mirrors the object-list input): a
                truncating title plus hover actions to move up / down / remove. */}
            {vm.values.length > 0 ? (
                <div className={"flex flex-col gap-xs"}>
                    {vm.values.map((entryId, index) => (
                        <ObjectRow
                            key={entryId}
                            title={labelFor(entryId)}
                            onOpen={() => undefined}
                            actions={
                                <ObjectRowActions
                                    onMoveUp={() => moveItem(index, index - 1)}
                                    onMoveDown={() => moveItem(index, index + 1)}
                                    onRemove={() =>
                                        setSelection(vm.values.filter(id => id !== entryId))
                                    }
                                    canMoveUp={index > 0}
                                    canMoveDown={index < vm.values.length - 1}
                                />
                            }
                        />
                    ))}
                </div>
            ) : null}
        </div>
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

    const sortFields = (config.sort?.fields ?? []).map(entry =>
        typeof entry === "string"
            ? { field: entry, label: entry }
            : { field: entry.field, label: entry.label ?? entry.field }
    );
    const singleSortField = sortFields.length === 1 ? sortFields[0] : null;
    const [searchText, setSearchText] = useState(current.search ?? "");

    const update = (patch: Partial<ContentEntryQueryValue>) => {
        onChange(({ value }) => {
            value.set({ ...current, ...patch });
        });
    };

    return (
        <div className={"flex flex-col gap-md"}>
            {singleSortField ? (
                // Only one sortable field → skip the field picker; just choose direction.
                <SegmentedControl
                    label={`Sort by ${singleSortField.label}`}
                    value={current.sort?.order ?? "asc"}
                    items={SORT_DIRECTION_OPTIONS}
                    fullWidth
                    onChange={order => {
                        update({
                            sort: {
                                field: singleSortField.field,
                                order: (order as "asc" | "desc") ?? "asc"
                            }
                        });
                    }}
                />
            ) : sortFields.length > 1 ? (
                <>
                    <Select
                        size={"md"}
                        variant={"secondary"}
                        label={"Sort by"}
                        value={current.sort?.field}
                        options={sortFields.map(field => ({
                            label: field.label,
                            value: field.field
                        }))}
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
                        <SegmentedControl
                            label={"Direction"}
                            value={current.sort?.order ?? "asc"}
                            items={SORT_DIRECTION_OPTIONS}
                            fullWidth
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
