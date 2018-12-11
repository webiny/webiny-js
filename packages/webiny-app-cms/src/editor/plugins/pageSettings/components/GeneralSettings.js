// @flow
import * as React from "react";
import { compose } from "recompose";
import { withCms } from "webiny-app-cms/context";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { Grid, Cell } from "webiny-ui/Grid";
import { TagsMultiAutoComplete } from "webiny-app-cms/admin/components/TagsMultiAutoComplete";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import PageImage from "./PageImage";

const GeneralSettings = ({ Bind, cms: { theme } }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"title"}>
                        <DelayedOnChange>
                            <Input label="Title" description="Page title" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"url"}>
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
                    <Bind name={"settings.general.image"}>
                        <PageImage label="Page Image" />
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default compose(withCms())(GeneralSettings);
