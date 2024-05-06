import React, { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CmsModelFieldRendererPlugin, CmsModelField } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { css } from "emotion";
import { validation } from "@webiny/validation";
import { useModel, useModelField } from "~/admin/hooks";
import { useForm, Bind } from "@webiny/form";
import { Alert } from "@webiny/ui/Alert";
import { allowCmsLegacyRichTextInput } from "~/utils/allowCmsLegacyRichTextInput";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-headless-cms/admin/content-model-editor/tabs/appearance-tab");

const style = {
    topLabel: css({
        marginBottom: 25
    }),
    noComponentsMessage: css({
        textAlign: "center",
        padding: 25
    }),
    radioContainer: css({
        marginBottom: 10,
        display: "flex"
    })
};

/**
 * We want the "hidden" renderer to always be the last one in the list.
 * @param a
 * @param b
 */
const hiddenLast = (a: CmsModelFieldRendererPlugin, b: CmsModelFieldRendererPlugin) => {
    if (a.renderer.rendererName === "hidden") {
        return 1;
    }

    if (b.renderer.rendererName === "hidden") {
        return -1;
    }

    return 0;
};

const AppearanceTab = () => {
    const form = useForm<CmsModelField>();
    const { model } = useModel();
    const { field, fieldPlugin } = useModelField();

    const renderPlugins = plugins
        .byType<CmsModelFieldRendererPlugin>("cms-editor-field-renderer")
        .filter(item => item.renderer.canUse({ field, fieldPlugin, model }))
        .sort(hiddenLast);

    useEffect((): void => {
        // If the currently selected render plugin is no longer available, select the first available one.
        const currentlySelectedRenderAvailable = renderPlugins.find(
            item => item.renderer.rendererName === field.renderer.name
        );

        if (currentlySelectedRenderAvailable) {
            return;
        }

        if (renderPlugins[0]) {
            form.setValue("renderer.name", renderPlugins[0].renderer.rendererName);
            return;
        }

        console.info(`No renderers for field ${field.fieldId} found.`, field);
    }, [field.id, field.multipleValues, field.predefinedValues?.enabled]);

    if (renderPlugins.length === 0) {
        return (
            <Grid>
                <Cell
                    span={12}
                    className={style.noComponentsMessage}
                >{t`There are no components that can render this field.`}</Cell>
            </Grid>
        );
    }

    return (
        <Grid>
            {allowCmsLegacyRichTextInput && (
                <Cell span={6}>
                    <Alert title={"You have legacy editor enabled"} type={"info"}>
                        Your project has been upgraded from an older Webiny version, with EditorJS
                        as the default rich text editor. We recommend switching to the new Lexical
                        rich text editor, where possible.
                        <br />
                        <br />
                        Read more about this in our{" "}
                        <a
                            href={"https://webiny.link/hcms-legacy-rte-support"}
                            rel="noreferrer"
                            target={"_blank"}
                        >
                            upgrade guide
                        </a>
                        .
                    </Alert>
                </Cell>
            )}
            <Cell span={12}>
                <div
                    className={style.topLabel}
                >{t`Choose a component that will render the field:`}</div>
                <Bind name={"renderer.name"} validate={validation.create("required")}>
                    <RadioGroup>
                        {({ onChange, getValue }) =>
                            renderPlugins.map(item => {
                                const setValue = onChange(item.renderer.rendererName);
                                return (
                                    <div key={item.name} className={style.radioContainer}>
                                        <Radio
                                            value={getValue(item.renderer.rendererName)}
                                            onChange={setValue}
                                        />

                                        <div onClick={setValue}>
                                            <div>{item.renderer.name}</div>
                                            <div>
                                                <Typography use={"caption"}>
                                                    {item.renderer.description}
                                                </Typography>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </RadioGroup>
                </Bind>
            </Cell>
        </Grid>
    );
};

export default AppearanceTab;
