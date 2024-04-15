import React, { useMemo } from "react";
import { ReactComponent as LanguageIcon } from "@material-design-icons/svg/round/language.svg";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { CmsModel } from "@webiny/app-headless-cms/types";
import { createListQueryDataSelection } from "@webiny/app-headless-cms-common";
import { useModel, useMutation } from "@webiny/app-headless-cms";
import { ContentEntryListConfig, useEntry } from "@webiny/app-headless-cms";
import { LanguageSelector } from "./ArticleEntryList/LanguageSelector";
import gql from "graphql-tag";
import { useRecords } from "@webiny/app-aco";
const { Browser } = ContentEntryListConfig;

const ARTICLE_MODEL_ID = "article";

const TranslateArticle = () => {
    const { model } = useModel();
    const { entry } = useEntry();
    const { showDialog } = useDialogs();
    const { showSnackbar } = useSnackbar();
    const { updateRecordInCache } = useRecords();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.EntryAction;
    const mutation = useMemo(() => getCloneArticleMutation(model), [model.modelId]);

    const [cloneArticle] = useMutation(mutation);

    const translate = () => {
        showDialog({
            title: "Translate Article",
            content: <LanguageSelector />,
            acceptLabel: "Translate",
            cancelLabel: "Cancel",
            loadingLabel: "Creating article...",
            onAccept: async data => {
                const language = data.language.id as string;
                const result = await cloneArticle({ variables: { id: entry.id, language } });
                if (!result.data) {
                    showSnackbar(
                        `We were unable to clone the article. See console for more details.`
                    );
                    console.log(result.errors);
                    return;
                }
                const newEntry = result.data.cloneArticle.data;
                updateRecordInCache(newEntry);
                showSnackbar(`A copy of "${entry.title}" was created!`);
            }
        });
    };

    if (!entry) {
        return null;
    }

    return <OptionsMenuItem icon={<LanguageIcon />} label={"Translate"} onAction={translate} />;
};

export const ArticleEntryList = () => {
    return (
        <ContentEntryListConfig>
            <Browser.EntryAction
                name={"translate"}
                element={<TranslateArticle />}
                modelIds={[ARTICLE_MODEL_ID]}
            />
        </ContentEntryListConfig>
    );
};

const getCloneArticleMutation = (model: CmsModel) => {
    const fields = model.fields.filter(field => {
        return ["text", "number", "boolean", "file", "long-text", "ref", "datetime"].includes(
            field.type
        );
    });

    return gql`
        mutation CloneArticleWithLanguage($id: ID!, $language: ID!) {
            cloneArticle(id: $id, language: $language) {
                data {
                    ${createListQueryDataSelection(model, fields)}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    `;
};
