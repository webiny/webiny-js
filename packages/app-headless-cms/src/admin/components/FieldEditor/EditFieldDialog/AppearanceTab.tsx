import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { i18n } from "@webiny/app/i18n";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { css } from "emotion";
import { validation } from "@webiny/validation";
import { useBind } from "@webiny/form";
import { allowCmsLegacyRichTextInput } from "~/utils/allowCmsLegacyRichTextInput";
import { Typography } from "@webiny/ui/Typography";
import { RendererOptions } from "./AppearanceTab/RendererOptions";
import { LegacyRichTextInput } from "./AppearanceTab/LegacyRichTextInput";
import { useRendererPlugins } from "./useRendererPlugins";

const t = i18n.ns("app-headless-cms/admin/content-model-editor/tabs/appearance-tab");

const style = {
    noComponentsMessage: css({
        textAlign: "center",
        padding: 25
    }),
    radioContainer: css({
        marginBottom: 10,
        display: "flex"
    })
};

const AppearanceTab = () => {
    const renderers = useRendererPlugins();

    const rendererName = useBind({
        name: "renderer.name",
        validate: validation.create("required")
    });

    const selectedPlugin = rendererName.value
        ? renderers.find(pl => pl.renderer.rendererName === rendererName.value)
        : undefined;

    if (renderers.length === 0) {
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
        <>
            <Grid>
                {allowCmsLegacyRichTextInput && (
                    <Cell span={6}>
                        <LegacyRichTextInput />
                    </Cell>
                )}
                <Cell span={12}>Choose a component that will render the field:</Cell>
                <Cell span={12}>
                    <RadioGroup {...rendererName}>
                        {({ onChange, getValue }) =>
                            renderers.map(item => {
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
                </Cell>
            </Grid>
            <RendererOptions plugin={selectedPlugin} />
        </>
    );
};

export default AppearanceTab;
