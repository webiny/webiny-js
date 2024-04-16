import React from "react";
import { plugins } from "@webiny/plugins";
import { CmsContentFormRendererPlugin } from "@webiny/app-headless-cms/types";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Grid, Cell } from "@webiny/ui/Grid";

const { FieldRenderers } = ContentEntryEditorConfig;

const DynamicZoneContainer = FieldRenderers.DynamicZone.Container.createDecorator(Original => {
    return function ContentContainer(props) {
        if (props.contentModel.modelId === "article" && props.field.fieldId === "content") {
            return <>{props.children}</>;
        }

        return <Original {...props} />;
    };
});

export const ArticleEntryForm = () => {
    plugins.register({
        type: "cms-content-form-renderer",
        modelId: "article",
        render({ fields }) {
            return (
                <Tabs>
                    <Tab label="General">
                        <Grid>
                            <Cell span={12}>{fields.title}</Cell>
                            <Cell span={12}>{fields.slug}</Cell>
                            <Cell span={12}>{fields.description}</Cell>
                            <Cell span={12}>{fields.heroImage}</Cell>
                            <Cell span={12}>{fields.region}</Cell>
                            <Cell span={12}>{fields.language}</Cell>
                            <Cell span={12}>{fields.cultureGroups}</Cell>
                            <Cell span={12}>{fields.companyExclusionLists}</Cell>
                        </Grid>
                    </Tab>
                    {/* Hide the Recipe tab if the user doesn't have the required permission. */}
                    <Tab label="Content">
                        <Grid>
                            <Cell span={12}>{fields.content}</Cell>
                        </Grid>
                    </Tab>
                    <Tab label="SEO">
                        <Grid>
                            <Cell span={12}>{fields.seoTitle}</Cell>
                            <Cell span={12}>{fields.seoDescription}</Cell>
                            <Cell span={12}>{fields.seoMetaTags}</Cell>
                        </Grid>
                    </Tab>
                </Tabs>
            );
        }
    } as CmsContentFormRendererPlugin);

    return <DynamicZoneContainer />;
};
