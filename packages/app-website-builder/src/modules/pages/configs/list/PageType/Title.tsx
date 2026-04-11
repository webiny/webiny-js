import React from "react";
import { Input, InputProps } from "@webiny/admin-ui";
import { UnsetOnUnmount } from "@webiny/form";
import { useBind } from "@webiny/form";
import type { FormAPI } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useForm } from "@webiny/form";
import { Grid } from "@webiny/admin-ui";
import { useLanguages } from "@webiny/languages/exports/admin/languages.js";
import { pagePathFromTitle } from "~/shared/pagePathFromTitle.js";
import type { LanguageDto } from "@webiny/languages/admin/features/listLanguages/index.js";

const generatePath = (form: FormAPI, languages: LanguageDto[]) => () => {
    // If more than 1 language is defined, append the language code to the page path
    const shouldPrependLanguage = languages.length > 1;

    const path = form.getValue("properties.path");
    const language = form.getValue("properties.language");

    const shouldGenerate = !path || (shouldPrependLanguage ? `/${language}` === path : true);

    if (!shouldGenerate) {
        return;
    }

    const titlePath = pagePathFromTitle(form.getValue("properties.title")) ?? null;
    const pathParts = [titlePath];

    if (shouldPrependLanguage) {
        pathParts.unshift(language);
    }
    form.setValue("properties.path", `/${pathParts.filter(Boolean).join("/")}`);
};

export const Title = (props?: InputProps) => {
    const { languages } = useLanguages();
    const form = useForm();

    const titleBind = useBind({
        name: "properties.title",
        validators: [validation.create("required")]
    });

    return (
        <Grid.Column span={12}>
            <UnsetOnUnmount name={"properties.title"}>
                <Input
                    label={"Title"}
                    {...titleBind}
                    onBlur={generatePath(form, languages)}
                    {...props}
                />
            </UnsetOnUnmount>
        </Grid.Column>
    );
};
