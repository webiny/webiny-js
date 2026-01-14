import React, { useCallback, useEffect, useRef, useState } from "react";
import pick from "lodash/pick.js";
import { NavigationPrompt } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { prepareFormData } from "@webiny/app-headless-cms-common";
import type { FormAPI, FormOnSubmit, FormValidation, FormInvalidFields } from "@webiny/form";
import type { CmsContentEntry, CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { CompositionScope, useSnackbar } from "@webiny/app-admin";
import type {
    CreateEntryResponse,
    UpdateEntryRevisionResponse
} from "~/admin/contexts/Cms/index.js";

const promptMessage =
    "There are some unsaved changes! Are you sure you want to navigate away and discard all changes?";

interface SaveEntryOptions {
    skipValidators?: string[];
    createNewRevision?: boolean;
}

export interface ContentEntryFormContext {
    entry: Partial<CmsContentEntry>;
    saveEntry: (options?: SaveEntryOptions) => Promise<CmsContentEntry | null>;
    invalidFields: FormInvalidFields;
}

export const ContentEntryFormContext = React.createContext<ContentEntryFormContext | undefined>(
    undefined
);

export interface SetSaveEntry {
    (cb: ContentEntryFormContext["saveEntry"]): void;
}

export interface PersistEntry {
    (
        entry: Partial<CmsContentEntry>,
        options?: SaveEntryOptions
    ): Promise<CreateEntryResponse | UpdateEntryRevisionResponse>;
}

interface ContentEntryFormProviderProps {
    entry: Partial<CmsContentEntry>;
    model: CmsModel;
    persistEntry: PersistEntry;
    confirmNavigationIfDirty: boolean;
    onChange?: FormOnSubmit<Partial<CmsContentEntry>>;
    onInvalidFields?: (invalidFields: FormValidation) => void;
    onAfterCreate?: (entry: CmsContentEntry) => void;
    setSaveEntry?: SetSaveEntry;
    children: React.ReactNode;
}

interface InvalidFieldError {
    fieldId: string;
    error: string;
}

const formValidationToMap = (invalidFields: FormValidation): FormInvalidFields => {
    return Object.keys(invalidFields).reduce(
        (acc, key) => ({ ...acc, [key]: invalidFields[key].message || "Value is invalid." }),
        {} as FormInvalidFields
    );
};

export const ContentEntryFormProvider = ({
    model,
    entry,
    children,
    persistEntry,
    onChange,
    onInvalidFields,
    onAfterCreate,
    setSaveEntry,
    confirmNavigationIfDirty
}: ContentEntryFormProviderProps) => {
    const ref = useRef<FormAPI<CmsContentEntry> | null>(null);
    const onAfterSubmitRef = useRef<(entry: CmsContentEntry) => void>(() => void 0);
    const [invalidFields, setInvalidFields] = useState<FormInvalidFields>({});
    const { showSnackbar } = useSnackbar();
    const saveOptionsRef = useRef<SaveEntryOptions>({ skipValidators: undefined });

    const saveEntry = useCallback(async (options: SaveEntryOptions = {}) => {
        saveOptionsRef.current.skipValidators = options.skipValidators;

        return ref.current!.submit(undefined, {
            skipValidators: options.skipValidators
        }) as unknown as Promise<CmsContentEntry | null>;
    }, []);

    const onFormSubmit: FormOnSubmit<CmsContentEntry> = async data => {
        const fieldsIds = model.fields.map(item => item.fieldId);
        const formData = pick(data, [...fieldsIds]);

        const gqlData = prepareFormData(formData, model.fields) as Partial<CmsContentEntry>;
        const isNewEntry = data.id === undefined;

        const { entry, error } = await persistEntry(
            { id: data.id, ...gqlData },
            {
                skipValidators: saveOptionsRef.current.skipValidators,
                createNewRevision: data.meta?.locked
            }
        );

        if (error) {
            if (error.code === "VALIDATION_FAILED") {
                const errors: InvalidFieldError[] = error.data || [];

                setInvalidFields(
                    errors.reduce((acc, item) => ({ ...acc, [item.fieldId]: item.error }), {})
                );
            }
            showSnackbar(error.message);

            return;
        }

        showSnackbar("Entry saved successfully!");
        setInvalidFields({});

        const isNewRevision = !isNewEntry && data.id !== entry.id;

        if ((isNewEntry || isNewRevision) && onAfterCreate) {
            onAfterSubmitRef.current = onAfterCreate;
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
            onSubmit={onFormSubmit}
            onAfterSubmit={data => {
                onAfterSubmitRef.current(data);
            }}
            onChange={onChange}
            data={entry}
            ref={ref}
            validateOnFirstSubmit
            invalidFields={invalidFields}
            onInvalid={invalidFields => {
                setInvalidFields(formValidationToMap(invalidFields));
                onInvalidFields && onInvalidFields(invalidFields);
                showSnackbar("Some fields did not pass the validation. Please check the form.");
            }}
        >
            {formProps => {
                const context: ContentEntryFormContext = {
                    entry: formProps.data,
                    saveEntry,
                    invalidFields
                };
                return (
                    <ContentEntryFormContext.Provider value={context}>
                        {confirmNavigationIfDirty ? (
                            <CompositionScope name={"cms.contentEntryForm"}>
                                <NavigationPrompt
                                    when={() => !formProps.form.isPristine}
                                    message={promptMessage}
                                />
                            </CompositionScope>
                        ) : null}
                        {children}
                    </ContentEntryFormContext.Provider>
                );
            }}
        </Form>
    );
};
