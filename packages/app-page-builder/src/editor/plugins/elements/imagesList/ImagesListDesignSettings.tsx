import * as React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { getPlugins } from "@webiny/plugins";
import { PbPageElementImagesListComponentPlugin } from "../../../../types";
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import SelectField from "../../elementSettings/components/SelectField";
import { classes } from "../../elementSettings/components/StyledComponents";
import ImagesList from "./ImagesList";

const ImagesListDesignSettings = ({ Bind, data }) => {
    const components = getPlugins<PbPageElementImagesListComponentPlugin>(
        "pb-editor-page-element-images-list-component"
    );

    return (
        <Accordion title={"Design"} defaultValue={true}>
            <React.Fragment>
                <Wrapper label={"Component"} containerClassName={classes.simpleGrid}>
                    <Bind
                        name={"component"}
                        defaultValue={components[0] ? components[0].componentName : null}
                    >
                        <SelectField
                            label={"Design"}
                            description={"Select a component to render the list"}
                        >
                            {components.map(cmp => (
                                <option key={cmp.name} value={cmp.componentName}>
                                    {cmp.title}
                                </option>
                            ))}
                        </SelectField>
                    </Bind>
                </Wrapper>

                <Grid className={classes.simpleGrid}>
                    <Cell span={12} style={{ overflowY: "scroll" }}>
                        <ImagesList data={data} />
                    </Cell>
                </Grid>
            </React.Fragment>
        </Accordion>
    );
};

export default ImagesListDesignSettings;
