// @flow
import * as React from "react";
import { compose, withHandlers } from "recompose";
import slugify from "slugify";
import { withPageBuilder } from "@webiny/app-page-builder/context";
import { Grid, Cell } from "@webiny/ui/Grid";
import { TagsMultiAutoComplete } from "@webiny/app-page-builder/admin/components";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import PageImage from "./PageImage";
import { set, get } from "lodash";
import appendOgImageDimensions from "./appendOgImageDimensions";

const toSlug = (value, cb) => {
    cb(slugify(value, { replacement: "-", lower: true, remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g })); // eslint-disable-line
};

const GeneralSettings = ({ Bind, onAfterChangeImage, pageBuilder: { theme } }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"title"} validators={["required"]}>
                        <Input label="Title" description="Page title" />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"url"} validators={["required"]} beforeChange={toSlug}>
                        <Input label="URL" description="Page URL" />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"snippet"}>
                        <Input rows={4} label="Snippet" description="Page snippet" />
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"settings.general.layout"} defaultValue={theme.layouts[0].name}>
                        <Select
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
                        <TagsMultiAutoComplete description="Enter tags to filter pages" />
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

export default compose(
    withPageBuilder(),
    withHandlers({
        hasOgImage: ({ form }) => () => {
            // const src = get(data, "settings.social.image.src"); // Doesn't work.
            const src = get(form.state, "data.settings.social.image.src"); // Works.

            return typeof src === "string" && src && !src.startsWith("data:");
        }
    }),
    withHandlers({
        onAfterChangeImage: ({ hasOgImage, form }) => selectedImage => {
            // If not already set, set selectedImage as og:image too.
            if (selectedImage && !hasOgImage()) {
                form.setState(state => {
                    set(state, "data.settings.social.image", selectedImage);
                    return state;
                });
                appendOgImageDimensions({ form, value: selectedImage });
            }
        }
    })
)(GeneralSettings);
