import React, { useState } from "react";
import { Dialog, Select, Text } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";
import type { LayoutsListPresenter } from "./abstractions.js";

interface TranslateLayoutDialogProps {
    presenter: LayoutsListPresenter.Interface;
    row: LayoutsListPresenter.RowViewModel;
    onClose: () => void;
}

/**
 * Create a language version of a source layout, in a language it has no version in yet.
 */
export const TranslateLayoutDialog = ({ presenter, row, onClose }: TranslateLayoutDialogProps) => {
    const { goToRoute } = useRouter();
    const [language, setLanguage] = useState<string>("");
    const [translating, setTranslating] = useState(false);

    const options = row.translatableLanguages.map(option => ({
        label: option.label,
        value: option.code
    }));

    const submit = async () => {
        if (!language) {
            return;
        }

        setTranslating(true);
        const version = await presenter.translate(row.layout, language);
        setTranslating(false);

        if (version) {
            onClose();
            goToRoute(Routes.Layouts.Editor, { id: version.id });
        }
    };

    return (
        <Dialog
            open={true}
            onClose={onClose}
            dismissible={!translating}
            loading={translating ? { text: "Translating layout..." } : undefined}
            title={"Translate layout"}
            description={`Create a language version of "${row.title}". Pages in that language are rendered in it once it's published.`}
            actions={
                <>
                    <Dialog.CancelAction onClick={onClose} text={"Cancel"} disabled={translating} />
                    <Dialog.ConfirmAction
                        onClick={submit}
                        text={"Translate"}
                        disabled={translating || !language}
                    />
                </>
            }
        >
            {options.length ? (
                <Select
                    label={"Language"}
                    placeholder={"Select a language"}
                    value={language}
                    onChange={setLanguage}
                    options={options}
                    displayResetAction={false}
                />
            ) : (
                <Text>{"The layout already has a version in every language."}</Text>
            )}
        </Dialog>
    );
};
