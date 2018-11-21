// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import PagesList from "./PagesList";
import { SimpleTagsMultiAutoComplete } from "webiny-app-cms/admin/components/TagsMultiAutoComplete";

const PagesListSettings = ({ theme, Bind }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={4}>
                    <Bind name={"settings.limit"} validators={["required", "numeric"]}>
                        <Input label={"Number of pages"} />
                    </Bind>
                </Cell>
                <Cell span={4}>
                    <Bind name={"settings.sortBy"} defaultValue={"publishedOn"}>
                        <Select label={"Sort by"}>
                            <option value={"publishedOn"}>Publishing date</option>
                            <option value={"title"}>Title</option>
                        </Select>
                    </Bind>
                </Cell>
                <Cell span={4}>
                    <Bind name={"settings.sortDirection"} defaultValue={-1}>
                        <Select label={"Sort direction"}>
                            <option value={-1}>Descending</option>
                            <option value={1}>Ascending</option>
                        </Select>
                    </Bind>
                </Cell>
            </Grid>

            <Grid>
                <Cell span={6}>
                    <Bind name="settings.tags">
                        <SimpleTagsMultiAutoComplete
                            label="Filter by tags"
                            description="Enter tags to filter pages"
                        />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"settings.tagsRule"} defaultValue={"all"}>
                        <Select label={"Filter by tags rule"}>
                            <option value={"all"}>Page must include all tags</option>
                            <option value={"any"}>Page must include any of the tags</option>
                        </Select>
                    </Bind>
                </Cell>
            </Grid>
            <Grid>
                <Cell span={12}>
                    <Bind
                        name={"settings.component"}
                        defaultValue={theme.elements.pagesList.components[0].name}
                    >
                        <Select
                            label={"List component"}
                            description={"Select a component to render the list"}
                        >
                            {theme.elements.pagesList.components.map(cmp => (
                                <option key={cmp.name} value={cmp.name}>
                                    {cmp.title}
                                </option>
                            ))}
                        </Select>
                    </Bind>
                </Cell>
            </Grid>
            <Grid>
                <Cell span={12} style={{ overflowY: "scroll" }}>
                    <Bind name={"settings"}>
                        {({ value }) => <PagesList settings={value} theme={theme} />}
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default PagesListSettings;
