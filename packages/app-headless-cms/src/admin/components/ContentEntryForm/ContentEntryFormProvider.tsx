import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import pick from "lodash/pick";
import debounce from "lodash/debounce";
import { Prompt } from "@webiny/react-router";
import { Form, FormAPI, FormOnSubmit, FormValidation } from "@webiny/form";
import { CmsContentEntry, CmsModel } from "@webiny/app-headless-cms-common/types";
import { useSnackbar } from "@webiny/app-admin";
import { prepareFormData } from "@webiny/app-headless-cms-common";
import { useContentEntry } from "~/index";
import { PartialCmsContentEntryWithId } from "~/admin/contexts/Cms";

function omitTypename(key: string, value: string): string | undefined {
    return key === "__typename" ? undefined : value;
}

const stringify = (value: any): string => {
    return JSON.stringify(value || {}, omitTypename);
};

const isDifferent = (value: any, compare: any): boolean => {
    if (!value && !compare) {
        return false;
    }
    return stringify(value) !== stringify(compare);
};

interface SaveEntryOptions {
    skipValidators?: string[];
}

export interface ContentEntryFormContext {
    entry: Partial<CmsContentEntry>;
    isDirty: boolean;
    saveEntry: (options?: SaveEntryOptions) => Promise<CmsContentEntry | null>;
    invalidFields: FormValidation;
}

export const ContentEntryFormContext = React.createContext<ContentEntryFormContext | undefined>(
    undefined
);

interface InvalidFieldError {
    fieldId: string;
    error: string;
}

interface PersistEntryParams {
    entry: PartialCmsContentEntryWithId;
    isLocked: boolean;
}

export interface SetSaveEntry {
    (cb: ContentEntryFormContext["saveEntry"]): void;
}

interface ContentEntryFormProviderProps {
    entry: Partial<CmsContentEntry>;
    model: CmsModel;
    onAfterCreate?: (entry: CmsContentEntry) => void;
    setSaveEntry?: SetSaveEntry;
    addItemToListCache?: boolean;
    children: React.ReactNode;
}

const formValidationToMap = (invalidFields: FormValidation) => {
    return Object.keys(invalidFields).reduce(
        (acc, key) => ({ ...acc, [key]: invalidFields[key].message }),
        {} as Record<string, string | undefined>
    );
};

export const ContentEntryFormProvider = ({
    model,
    entry,
    children,
    onAfterCreate,
    setSaveEntry,
    addItemToListCache
}: ContentEntryFormProviderProps) => {
    const ref = useRef<FormAPI<CmsContentEntry> | null>(null);
    const [invalidFields, setInvalidFields] = useState({});
    const { showSnackbar } = useSnackbar();
    const contentEntry = useContentEntry();
    const saveOptionsRef = useRef<SaveEntryOptions>({ skipValidators: undefined });
    const [isDirty, setIsDirty] = React.useState<boolean>(false);

    // Reset `isDirty` when data changes from outside.
    useEffect(() => {
        if (!isDirty) {
            return;
        }
        setIsDirty(false);
    }, [entry]);

    const saveEntry = useCallback(async (options: SaveEntryOptions = {}) => {
        saveOptionsRef.current.skipValidators = options.skipValidators;

        return ref.current!.submit(undefined, {
            skipValidators: options.skipValidators
        }) as unknown as Promise<CmsContentEntry | null>;
    }, []);

    const persistEntry = ({ entry, isLocked }: PersistEntryParams) => {
        const options = {
            skipValidators: saveOptionsRef.current.skipValidators,
            addItemToListCache
        };

        if (!entry.id) {
            return contentEntry.createEntry({ entry, options });
        }

        if (!isLocked) {
            return contentEntry.updateEntryRevision({
                entry,
                options: { skipValidators: options?.skipValidators }
            });
        }

        const { id, ...input } = entry;

        return contentEntry.createEntryRevisionFrom({
            id,
            input,
            options: { skipValidators: options?.skipValidators }
        });
    };

    const onChange = useMemo(() => {
        return debounce(data => {
            const different = isDifferent(data, entry);
            if (isDirty !== different) {
                setIsDirty(different);
            }
        }, 500);
    }, [isDirty, entry]);

    const onFormSubmit: FormOnSubmit<CmsContentEntry> = async data => {
        const fieldsIds = model.fields.map(item => item.fieldId);
        const formData = pick(data, [...fieldsIds]);

        const gqlData = prepareFormData(formData, model.fields) as Partial<CmsContentEntry>;
        const isNewEntry = data.id === undefined;

        const { entry, error } = await persistEntry({
            entry: { id: data.id, ...gqlData },
            isLocked: data.meta?.locked === true
        });

        if (error) {
            showSnackbar(error.message);
            setInvalidFields(error.data as InvalidFieldError[]);
            return;
        }

        setInvalidFields({});
        setIsDirty(false);

        const isNewRevision = !isNewEntry && data.id !== entry.id;

        if ((isNewEntry || isNewRevision) && onAfterCreate) {
            // We need a timeout to let the Prompt component update.
            await new Promise<void>(resolve => {
                setTimeout(() => {
                    onAfterCreate(entry);
                    resolve();
                }, 10);
            });
        }

        return entry;
    };

    useEffect(() => {
        if (typeof setSaveEntry === "function") {
            setSaveEntry(saveEntry);
        }
    }, [setSaveEntry]);

    return (
        <Form<CmsContentEntry>
            onChange={onChange}
            onSubmit={onFormSubmit}
            data={entry}
            ref={ref}
            invalidFields={invalidFields}
            onInvalid={invalidFields => {
                setIsDirty(true);
                setInvalidFields(formValidationToMap(invalidFields));
                showSnackbar("Some fields did not pass the validation. Please check the form.");
            }}
        >
            {formProps => {
                const context: ContentEntryFormContext = {
                    entry: formProps.data,
                    saveEntry,
                    isDirty,
                    invalidFields
                };
                return (
                    <ContentEntryFormContext.Provider value={context}>
                        <Prompt
                            when={isDirty}
                            message={
                                "There are some unsaved changes! Are you sure you want to navigate away and discard all changes?"
                            }
                        />
                        {children}
                    </ContentEntryFormContext.Provider>
                );
            }}
        </Form>
    );
};
