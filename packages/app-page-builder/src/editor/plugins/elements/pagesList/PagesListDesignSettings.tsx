import * as React from "react";
import { plugins } from "@webiny/plugins";
import { validation } from "@webiny/validation";
import { PbPageElementPagesListComponentPlugin } from "~/types";
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
import SelectField from "../../elementSettings/components/SelectField";
import {
    ButtonContainer,
    classes,
    SimpleButton
} from "../../elementSettings/components/StyledComponents";
import { Cell, Grid } from "@webiny/ui/Grid";
import { BindComponent } from "@webiny/form";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { PagesListRenderer } from "@webiny/app-page-builder-elements/renderers/pagesList";
import { isLegacyRenderingEngine } from "~/utils";
import { PagesListComponent } from "@webiny/app-page-builder-elements/renderers/pagesList";

interface PagesListDesignSettingsProps {
    Bind: BindComponent;
    submit: (event: React.MouseEvent) => void;
}

const PagesListDesignSettings: React.FC<PagesListDesignSettingsProps> = ({ Bind, submit }) => {
    let components: Array<{
        name?: string;
        title: string;
        componentName: string;
    }> = [];

    if (!isLegacyRenderingEngine) {
        const { renderers } = usePageElements();
        const PagesList = renderers?.["pages-list"] as PagesListRenderer;
        // @ts-ignore
        const pagesListRendererParams = PagesList?.params;
        if (pagesListRendererParams?.pagesListComponents) {
            const pagesListComponents = pagesListRendererParams?.pagesListComponents;

            let pagesListComponentsList: PagesListComponent[];
            if (typeof pagesListComponents === "function") {
                pagesListComponentsList = pagesListComponents();
            } else {
                pagesListComponentsList = pagesListComponents;
            }

            components = pagesListComponentsList.map(item => {
                return {
                    title: item.name,
                    name: item.name,
                    componentName: item.id
                };
            });
        }
    } else {
        components = plugins.byType<PbPageElementPagesListComponentPlugin>(
            "pb-page-element-pages-list-component"
        );
    }

    return (
        <Accordion title={"Design"} defaultValue={true}>
            <React.Fragment>
                <Wrapper
                    label={"Component"}
                    containerClassName={classes.simpleGrid}
                    leftCellSpan={5}
                    rightCellSpan={7}
                >
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
                <Wrapper
                    label={"Results per page"}
                    containerClassName={classes.simpleGrid}
                    leftCellSpan={5}
                    rightCellSpan={7}
                >
                    <Bind name={"resultsPerPage"} validators={validation.create("numeric")}>
                        <InputField />
                    </Bind>
                </Wrapper>
                <Grid className={classes.simpleGrid}>
                    <Cell span={12}>
                        <ButtonContainer>
                            <SimpleButton onClick={submit}>Save</SimpleButton>
                        </ButtonContainer>
                    </Cell>
                </Grid>
            </React.Fragment>
        </Accordion>
    );
};
export default PagesListDesignSettings;
