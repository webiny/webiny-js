// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { withCms } from "webiny-app-cms/context";
import PagesList from "./PagesList";
import { getPlugins } from "webiny-plugins";

const PagesListDesignSettings = ({ cms: { theme }, Bind, data }: Object) => {
    const components = getPlugins("cms-element-pages-list-component");

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
                    <Bind name={"resultsPerPage"} validators={["numeric"]}>
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
};

export default withCms()(PagesListDesignSettings);
