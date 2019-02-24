// @flow
import * as React from "react";
import { compose } from "recompose";
import slugify from "slugify";
import { withCms } from "webiny-app-cms/context";
import { Grid, Cell } from "webiny-ui/Grid";
import { TagsMultiAutoComplete } from "webiny-app-cms/admin/components";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import PageImage from "./PageImage";

const toSlug = (value, cb) => {
    cb(slugify(value, { replacement: "-", lower: true, remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g }));
};

const GeneralSettings = ({ Bind, cms: { theme } }: Object) => {
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
                    <Bind name={"settings.general.image"}>
                        <PageImage label="Page Image" />
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default compose(withCms())(GeneralSettings);
