// @flow
import * as React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import PagesList from "./PagesList";
import { getPlugins } from "@webiny/plugins";
import { validation } from "@webiny/validation";

const PagesListDesignSettings = ({ Bind, data }: Object) => {
    const components = getPlugins("pb-page-element-pages-list-component");

    return (
        <React.Fragment>
            <Grid>
                <Cell span={6}>
                    <Bind
                        name={"component"}
                        defaultValue={components[0] ? components[0].componentName : null}
                    >
                        <Select
                            label={"Design"}
                            description={"Select a component to render the list"}
                        >
                            {components.map(cmp => (
                                <option key={cmp.name} value={cmp.componentName}>
                                    {cmp.title}
                                </option>
                            ))}
                        </Select>
                    </Bind>
                </Cell>

                <Cell span={6}>
                    <Bind name={"resultsPerPage"} validators={validation.create("numeric")}>
                        <Input label={"Results per page"} />
                    </Bind>
                </Cell>
            </Grid>

            <Grid>
                <Cell span={12} style={{ overflowY: "scroll" }}>
                    <PagesList data={data} />
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default PagesListDesignSettings;
