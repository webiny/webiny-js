// @flow
import * as React from "react";
import { compose, withHandlers } from "recompose";
import { withCms } from "webiny-app-cms/context";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { Grid, Cell } from "webiny-ui/Grid";
import { TagsMultiAutoComplete } from "webiny-app-cms/admin/components";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import PageImage from "./PageImage";
import { set, get } from "lodash";

const GeneralSettings = ({ Bind, onAfterChangeImage, cms: { theme } }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"title"} validators={["required"]}>
                        <DelayedOnChange>
                            <Input label="Title" description="Page title" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"url"} validators={["required"]}>
                        <DelayedOnChange>
                            <Input label="URL" description="Page URL" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"snippet"}>
                        <DelayedOnChange>
                            <Input rows={4} label="Snippet" description="Page snippet" />
                        </DelayedOnChange>
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
    withCms(),
    withHandlers({
        hasOgImage: ({ data }) => () => !!get(data, "settings.social.image.src")
    }),
    withHandlers({
        onAfterChangeImage: ({ hasOgImage, form }) => selectedImage => {
            // If not already set, set selectedImage as og:image too.
            if (selectedImage && !hasOgImage()) {
                form.setState(state => {
                    set(state, "data.settings.social.image", selectedImage);
                    return state;
                });
            }
        }
    })
)(GeneralSettings);
