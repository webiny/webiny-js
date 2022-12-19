import React, { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CmsEditorField, CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";
import { validation } from "@webiny/validation";
import { useModelField } from "~/admin/hooks";
import { useForm, Bind } from "@webiny/form";

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
        marginBottom: 10
    })
};

const AppearanceTab = () => {
    const form = useForm<CmsEditorField>();
    const { field, fieldPlugin } = useModelField();

    const renderPlugins = plugins
        .byType<CmsEditorFieldRendererPlugin>("cms-editor-field-renderer")
        .filter(item => item.renderer.canUse({ field, fieldPlugin }));

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
            <Cell span={12}>
                <div
                    className={style.topLabel}
                >{t`Choose a component that will render the field:`}</div>
                <Bind name={"renderer.name"} validate={validation.create("required")}>
                    <RadioGroup>
                        {({ onChange, getValue }) => (
                            <React.Fragment>
                                {renderPlugins.map(item => (
                                    <div key={item.name} className={style.radioContainer}>
                                        <Radio
                                            value={getValue(item.renderer.rendererName)}
                                            onChange={onChange(item.renderer.rendererName)}
                                            label={
                                                <>
                                                    <div>{item.renderer.name}</div>
                                                    <div>
                                                        <Typography use={"caption"}>
                                                            {item.renderer.description}
                                                        </Typography>
                                                    </div>
                                                </>
                                            }
                                        />
                                    </div>
                                ))}
                            </React.Fragment>
                        )}
                    </RadioGroup>
                </Bind>
            </Cell>
        </Grid>
    );
};

export default AppearanceTab;
