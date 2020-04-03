import React from "react";
import { Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { i18n } from "@webiny/app/i18n";
import { validation } from "@webiny/validation";
import slugify from "slugify";
const t = i18n.ns("app-headless-cms/admin/components/name-slug");

const toSlug = text =>
    slugify(text, {
        replacement: "-",
        lower: true,
        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
    });

const slugValidator = async (value, validateSlugUniqueness, formData) => {
    if (formData.id) {
        return;
    }

    validation.validateSync(value, "required,maxLength:100");
    await validateSlugUniqueness();
};

let currentFormData;

function NameSlug({ formData, Bind, setValue, name = {}, slug = {}, validateSlugUniqueness }) {

    // A weird issue is happening here - afterChange always contains the initial "{}" as the "formData" value.
    // This was a temporary fix 😐
    currentFormData = formData;

    return (
        <>
            <Cell span={6}>
                <Bind
                    {...name}
                    name="name"
                    validators={validation.create("required,maxLength:100")}
                    afterChange={value => {
                        if (!currentFormData.id) {
                            setValue("slug", toSlug(value));
                        }
                    }}
                >
                    <Input label={t`Name`} />
                </Bind>
            </Cell>
            <Cell span={6}>
                <Bind
                    name="slug"
                    validators={value => slugValidator(value, validateSlugUniqueness, formData)}
                >
                    {bindProps => (
                        <Input
                            description={t`Cannot be changed.`}
                            {...bindProps}
                            {...slug}
                            disabled={formData.id}
                            label={t`Slug`}
                        />
                    )}
                </Bind>
            </Cell>
        </>
    );
}

export default NameSlug;
