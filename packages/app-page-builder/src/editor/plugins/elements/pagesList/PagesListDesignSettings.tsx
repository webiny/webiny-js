import * as React from "react";
import { getPlugins } from "@webiny/plugins";
import { validation } from "@webiny/validation";
import { PbPageElementPagesListComponentPlugin } from "@webiny/app-page-builder/types";
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
import SelectField from "../../elementSettings/components/SelectField";
import { classes } from "../../elementSettings/components/StyledComponents";

const PagesListDesignSettings = ({ Bind }) => {
    const components = getPlugins<PbPageElementPagesListComponentPlugin>(
        "pb-page-element-pages-list-component"
    );

    return (
        <Accordion title={"Design"} defaultValue={true}>
            <React.Fragment>
                <Wrapper label={"Component"} containerClassName={classes.simpleGrid}>
                    <Bind
                        name={"component"}
                        defaultValue={components[0] ? components[0].componentName : null}
                    >
                        {({ value, onChange }) => (
                            <SelectField
                                value={value}
                                onChange={onChange}
                                description={"Select a component to render the list"}
                            >
                                {components.map(cmp => (
                                    <option key={cmp.name} value={cmp.componentName}>
                                        {cmp.title}
                                    </option>
                                ))}
                            </SelectField>
                        )}
                    </Bind>
                </Wrapper>
                <Wrapper label={"Results per page"} containerClassName={classes.simpleGrid}>
                    <Bind name={"resultsPerPage"} validators={validation.create("numeric")}>
                        <InputField />
                    </Bind>
                </Wrapper>
            </React.Fragment>
        </Accordion>
    );
};

export default PagesListDesignSettings;
