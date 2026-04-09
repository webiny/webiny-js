import React, { useEffect, useState } from "react";
import { useDialog } from "@webiny/app-admin";
import { Dialog, Grid, Select } from "@webiny/admin-ui";
import { Bind, Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useFeature } from "@webiny/app";
import { FolderPicker } from "@webiny/app-aco";
import { ListLanguagesFeature } from "@webiny/languages/admin/features/listLanguages/index.js";
import { useTranslatePage } from "~/presentation/pages/hooks/useTranslatePage.js";
import { useEditPageUrl } from "~/modules/pages/PagesList/hooks/useEditPageUrl.js";
import { translatePageParams } from "./translatePageSchema.js";

export const TRANSLATE_PAGE_DIALOG = "translatePage";

export const TranslatePageDialog = () => {
    const { params, closeDialog } = useDialog(translatePageParams);
    const { translatePage } = useTranslatePage();
    const { goToPageEditor } = useEditPageUrl();
    const { useCase: listLanguagesUseCase } = useFeature(ListLanguagesFeature);

    const [languages, setLanguages] = useState<Array<{ code: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listLanguagesUseCase.execute().then(langs => {
            setLanguages(langs);
            setLoading(false);
        });
    }, []);

    const handleSubmit = async (data: Record<string, unknown>) => {
        const { languageCode, folderId } = data as {
            languageCode: string;
            folderId: string;
        };

        const newPage = await translatePage({
            id: params.pageId,
            languageCode,
            folderId
        });

        closeDialog();
        goToPageEditor(newPage.id);
    };

    return (
        <Form onSubmit={handleSubmit} data={{ folderId: params.folderId }}>
            {({ submit }) => (
                <Dialog
                    open={true}
                    onClose={closeDialog}
                    title="Translate Page"
                    description="Select a target language and destination folder"
                    actions={
                        <>
                            <Dialog.CancelAction onClick={closeDialog} text="Cancel" />
                            <Dialog.ConfirmAction
                                onClick={submit}
                                text={loading ? "Loading..." : "Confirm"}
                            />
                        </>
                    }
                >
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
                            <Bind name={"folderId"} defaultValue={params.folderId}>
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
                </Dialog>
            )}
        </Form>
    );
};
