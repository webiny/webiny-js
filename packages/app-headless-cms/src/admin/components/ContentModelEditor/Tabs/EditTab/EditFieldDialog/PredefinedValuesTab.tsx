import React, { useState, useCallback } from "react";
import { getPlugins } from "@webiny/plugins";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
import { css } from "emotion";
import { ContentModelForm } from "@webiny/app-headless-cms/admin/components/ContentModelForm";
import cloneDeep from "lodash/cloneDeep";
import LocaleSelector from "./LocaleSelector";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import debounce from "lodash/debounce";

const t = i18n.ns("app-headless-cms/admin/components/editor/tabs/edit-field-dialog/appearance-tab");

const style = {
    topLabel: css({
        marginBottom: 25
    }),
    noComponentsMessage: css({
        textAlign: "center",
        padding: 25
    }),
    radioContainer: css({
        marginBottom: 10
    })
};

const PredefinedValuesTab = props => {
    const { field: passedField, form } = props;
    const i18n = useI18N();

    const [locale, setLocale] = useState(i18n.getLocale().id);
    const getLocale = useCallback(() => locale, [locale]);

    const field = cloneDeep(passedField);
    field.fieldId = "predefinedValues";
    field._id = "predefinedValues";
    field.multipleValues = true;

    const [defaultRenderPlugin] = getPlugins<CmsEditorFieldRendererPlugin>(
        "cms-editor-field-renderer"
    ).filter(item => item.renderer.canUse({ field: { ...field, multipleValues: true } }));

    if (!defaultRenderPlugin) {
        return (
            <Grid>
                <Cell
                    span={12}
                    className={style.noComponentsMessage}
                >{t`There are no component that can render this field.`}</Cell>
            </Grid>
        );
    }

    field.renderer = {
        name: defaultRenderPlugin.renderer.rendererName
    };

    const { Bind } = form;
    return (
        <>
            <Grid>
                <Cell span={12}>
                    <LocaleSelector locale={getLocale()} setLocale={setLocale} />
                </Cell>
                <Cell span={12}>
                    <hr />
                </Cell>
            </Grid>
            <Bind name={"predefinedValues"}>
                <ContentModelForm
                    locale={locale}
                    contentModel={{ fields: [field] }}
                    onChange={data => {
                        console.log("dobeoooo", data);
                    }}
                />
            </Bind>
        </>
    );
};

export default PredefinedValuesTab;
