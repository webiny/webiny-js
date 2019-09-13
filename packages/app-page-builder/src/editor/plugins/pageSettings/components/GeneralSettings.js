// @flow
import React, { useCallback } from "react";
import slugify from "slugify";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { Grid, Cell } from "@webiny/ui/Grid";
import { TagsMultiAutocomplete } from "@webiny/app-page-builder/admin/components/TagsMultiAutocomplete";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import PageImage from "./PageImage";
import { set, get } from "lodash";
import appendOgImageDimensions from "./appendOgImageDimensions";
import { validation } from "@webiny/validation";

const toSlug = (value, cb) => {
    cb(slugify(value, { replacement: "-", lower: true, remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g })); // eslint-disable-line
};

const GeneralSettings = ({ form, Bind }: Object) => {
    const { theme } = usePageBuilder();

    const hasOgImage = useCallback(() => {
        // const src = get(data, "settings.social.image.src"); // Doesn't work.
        const src = get(form.state, "data.settings.social.image.src"); // Works.

        return typeof src === "string" && src && !src.startsWith("data:");
    }, [form]);

    const onAfterChangeImage = useCallback(
        selectedImage => {
            // If not already set, set selectedImage as og:image too.
            if (selectedImage && !hasOgImage()) {
                form.setState(state => {
                    set(state, "data.settings.social.image", selectedImage);
                    return state;
                });
                return appendOgImageDimensions({ form, value: selectedImage });
            }
        },
        [hasOgImage, form]
    );

    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"title"} validators={validation.create("required")}>
                        <Input label="Title" description="Page title" />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"url"} validators={validation.create("required")} beforeChange={toSlug}>
                        <Input label="URL" description="Page URL" />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"snippet"}>
                        <Input rows={4} label="Snippet" description="Page snippet" box={"true"} />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"settings.general.layout"} defaultValue={theme.layouts[0].name}>
                        <Select
                            box={"true"}
                            label={"Layout"}
                            description={"Render this page using the selected layout"}
                        >
                            {theme.layouts.map(({ name, title }) => (
                                <option key={name} value={name}>
                                    {title}
                                </option>
                            ))}
                        </Select>
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"settings.general.tags"}>
                        <TagsMultiAutocomplete description="Enter tags to filter pages" />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"settings.general.image"} afterChange={onAfterChangeImage}>
                        <PageImage label="Page Image" />
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default GeneralSettings;
