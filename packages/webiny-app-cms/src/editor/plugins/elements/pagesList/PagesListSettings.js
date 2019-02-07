// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { withCms } from "webiny-app-cms/context";
import PagesList from "./PagesList";
import { TagsMultiAutoComplete, CategoriesAutoComplete } from "webiny-app-cms/admin/components";
import { getPlugins } from "webiny-plugins";

const PagesListSettings = ({ filter, design, cms: { theme }, Bind, data }: Object) => {
    const components = getPlugins("cms-pages-list-component");

    if (filter) {
        return (
            <React.Fragment>
                <Grid>
                    <Cell span={6}>
                        <Bind name={"category"}>
                            <CategoriesAutoComplete label="Category" />
                        </Bind>
                    </Cell>
                    <Cell span={6}>
                        <Bind name={"pagesLimit"} validators={"numeric"}>
                            <Input
                                label={"Number of pages to show"}
                                description={"Leave empty to show all"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
                <Grid>
                    <Cell span={6}>
                        <Bind name={"sortBy"} defaultValue={"publishedOn"}>
                            <Select label={"Sort by"}>
                                <option value={"publishedOn"}>Publishing date</option>
                                <option value={"title"}>Title</option>
                            </Select>
                        </Bind>
                    </Cell>
                    <Cell span={6}>
                        <Bind name={"sortDirection"} defaultValue={-1}>
                            <Select label={"Sort direction"}>
                                <option value={-1}>Descending</option>
                                <option value={1}>Ascending</option>
                            </Select>
                        </Bind>
                    </Cell>
                </Grid>

                <Grid>
                    <Cell span={6}>
                        <Bind name="tags">
                            <TagsMultiAutoComplete
                                label="Filter by tags"
                                description="Enter tags to filter pages"
                            />
                        </Bind>
                    </Cell>
                    <Cell span={6}>
                        <Bind name={"tagsRule"} defaultValue={"ALL"}>
                            <Select label={"Filter by tags rule"}>
                                <option value={"ALL"}>Page must include all tags</option>
                                <option value={"ANY"}>Page must include any of the tags</option>
                            </Select>
                        </Bind>
                    </Cell>
                </Grid>
            </React.Fragment>
        );
    }

    if (design) {
        return (
            <React.Fragment>
                <Grid>
                    <Cell span={6}>
                        <Bind
                            name={"component"}
                            defaultValue={components[0] ? components[0].name : null}
                        >
                            <Select
                                label={"Design"}
                                description={"Select a component to render the list"}
                            >
                                {components.map(cmp => (
                                    <option key={cmp.name} value={cmp.name}>
                                        {cmp.title}
                                    </option>
                                ))}
                            </Select>
                        </Bind>
                    </Cell>

                    <Cell span={6}>
                        <Bind name={"resultsPerPage"} defaultValue={10} validators={["numeric"]}>
                            <Input label={"Results per page"} />
                        </Bind>
                    </Cell>
                </Grid>

                <Grid>
                    <Cell span={12} style={{ overflowY: "scroll" }}>
                        <PagesList data={data} theme={theme} />
                    </Cell>
                </Grid>
            </React.Fragment>
        );
    }

    return null;
};

export default withCms()(PagesListSettings);
