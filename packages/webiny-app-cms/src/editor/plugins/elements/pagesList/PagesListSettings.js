import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";

const PagesListSettings = ({ Bind, theme }) => {
    return (
        <Grid>
            <Cell span={12}>
                <Bind name={"settings.limit"} validators={["required"]}>
                    <Input label={"Limit"} />
                </Bind>
                <Bind name={"settings.component"} defaultValue={theme.elements.pagesList.components[0].name}>
                    <Select label={"Component"}>
                        {theme.elements.pagesList.components.map(cmp => (
                            <option key={cmp.name} value={cmp.name}>
                                {cmp.title}
                            </option>
                        ))}
                    </Select>
                </Bind>
            </Cell>
        </Grid>
    );
};

export default PagesListSettings;
