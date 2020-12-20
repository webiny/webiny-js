import React, { useCallback } from "react";
import slugify from "slugify";
import { getPlugins } from "@webiny/plugins";
import { Grid, Cell } from "@webiny/ui/Grid";
import { TagsMultiAutocomplete } from "@webiny/app-page-builder/admin/components/TagsMultiAutocomplete";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { get } from "lodash";
import appendOgImageDimensions from "./appendOgImageDimensions";
import { validation } from "@webiny/validation";
import { PbPageLayoutPlugin } from "@webiny/app-page-builder/types";

const toSlug = (value, cb) => {
    cb(slugify(value, { replacement: "-", lower: true, remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g })); // eslint-disable-line
};

const GeneralSettings = ({ form, data, Bind, setValue }) => {
    const layouts = React.useMemo(
        () => getPlugins<PbPageLayoutPlugin>("pb-page-layout").map(pl => pl.layout),
        []
    );

    const hasOgImage = useCallback(() => {
        // const src = get(data, "settings.social.image.src"); // Doesn't work.
        const src = get(form.state, "data.settings.social.image.src"); // Works.

        return typeof src === "string" && src && !src.startsWith("data:");
    }, [form]);

    const onAfterChangeImage = useCallback(
        selectedImage => {
            // If not already set, set selectedImage as og:image too.
            if (selectedImage && !hasOgImage()) {
                appendOgImageDimensions({ data, value: selectedImage, setValue });
            }
        },
        [hasOgImage, form]
    );

    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    {/* We need this hidden field because of the `appendOgImageDimensions` callback and because
                    of the fact that it sts values into the `settings.social.meta` array. */}
                    <Bind name={"settings.social.meta"} />
                    <Bind name={"title"} validators={validation.create("required")}>
                        <Input label="Title" description="Page title" />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind
                        name={"path"}
                        validators={validation.create("required")}
                        beforeChange={toSlug}
                    >
                        <Input label="Path" description="Page path (e.g. /about-us)" />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"settings.general.snippet"}>
                        <Input rows={4} label="Snippet" description="Page snippet" />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"settings.general.layout"} defaultValue={layouts[0].name}>
                        <Select
                            box={"true"}
                            label={"Layout"}
                            description={"Render this page using the selected layout"}
                        >
                            {layouts.map(({ name, title }) => (
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
                        <SingleImageUpload onChangePick={["id", "src"]} label="Page Image" />
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default GeneralSettings;
