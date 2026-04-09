import React from "react";
import { ReactComponent as TranslateIcon } from "@webiny/icons/language.svg";
import { useDialogs } from "@webiny/app-admin";
import { Grid, Select } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useFeature } from "@webiny/app";
import { FolderPicker } from "@webiny/app-aco";
import { ListLanguagesFeature } from "@webiny/languages/admin/features/listLanguages/index.js";
import { usePage } from "~/modules/pages/PagesList/hooks/usePage.js";
import { PageListConfig } from "~/modules/pages/configs/index.js";
import { useTranslatePage } from "~/presentation/pages/TranslatePage/hooks/useTranslatePage.js";
import { useEditPageUrl } from "~/modules/pages/PagesList/hooks/useEditPageUrl.js";

const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

export const TranslatePageAction = () => {
    const dialogs = useDialogs();
    const { page } = usePage();
    const { goToPageEditor } = useEditPageUrl();
    const { translatePage } = useTranslatePage();
    const { useCase: listLanguagesUseCase } = useFeature(ListLanguagesFeature);

    const openTranslateDialog = async () => {
        // Load languages via use case.
        const languages = await listLanguagesUseCase.execute();

        dialogs.showDialog({
            title: "Translate Page",
            description: "Select a target language and destination folder",
            content: (
                <TranslatePageForm languages={languages} currentFolderId={page.location.folderId} />
            ),
            loadingLabel: "Translating page...",
            onAccept: async data => {
                const { languageCode, folderId } = data as {
                    languageCode: string;
                    folderId: string;
                };

                const newPage = await translatePage({
                    id: page.id,
                    languageCode,
                    folderId
                });

                goToPageEditor(newPage.id);
            }
        });
    };

    return (
        <OptionsMenuItem
            icon={<TranslateIcon />}
            label="Translate"
            onAction={openTranslateDialog}
        />
    );
};

interface TranslatePageFormProps {
    currentFolderId: string;
    languages: Array<{ code: string; name: string }>;
}

const TranslatePageForm = ({ languages, currentFolderId }: TranslatePageFormProps) => {
    return (
        <Grid>
            <Grid.Column span={12}>
                <Bind name="languageCode" validators={[validation.create("required")]}>
                    <Select
                        label="Target Language"
                        placeholder="Select a language"
                        options={languages.map(lang => ({
                            value: lang.code,
                            label: lang.name
                        }))}
                    />
                </Bind>
            </Grid.Column>

            <Grid.Column span={12}>
                <Bind name={"folderId"} defaultValue={currentFolderId}>
                    {({ value, onChange }) => (
                        <FolderPicker
                            label={"Destination Folder"}
                            value={value}
                            onChange={onChange}
                            enableCreate={true}
                        />
                    )}
                </Bind>
            </Grid.Column>
        </Grid>
    );
};
