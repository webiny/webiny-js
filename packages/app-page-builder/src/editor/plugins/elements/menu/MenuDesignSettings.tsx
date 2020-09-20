import * as React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import Menu from "./Menu";
import { getPlugins } from "@webiny/plugins";
import { validation } from "@webiny/validation";
import { PbPageElementMenuComponentPlugin } from "@webiny/app-page-builder/types";

const MenuDesignSettings = ({ Bind, data }) => {
    const components = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    );
    /*
                    <Cell span={6}>
                    <Bind name={"resultsPerPage"} validators={validation.create("numeric")}>
                        <Input label={"Results per page"} />
                    </Bind>
                </Cell>*/

    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
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
                                    TITLE: {cmp.title} ~ NAME: {cmp.name} ~ COMPONENT NAME: {cmp.componentName}
                                </option>
                            ))}
                        </Select>
                    </Bind>
                </Cell>
            </Grid>

            <Grid>
                <Cell span={12} style={{ overflowY: "scroll" }}>
                    <Menu data={data} />
                </Cell>
            </Grid>
        </React.Fragment>
    );
}

export default MenuDesignSettings;
