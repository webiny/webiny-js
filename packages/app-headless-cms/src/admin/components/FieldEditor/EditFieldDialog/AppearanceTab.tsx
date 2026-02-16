import React, { useEffect } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { css } from "@emotion/css";
import { validation } from "@webiny/validation";
import { useBind } from "@webiny/form";
import { RendererOptions } from "./AppearanceTab/RendererOptions.js";
import { useRendererPlugins } from "./useRendererPlugins.js";
import { useModelField } from "~/admin/components/ModelFieldProvider/index.js";
import { RadioGroup, Text, Grid, Heading } from "@webiny/admin-ui";

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
    const { field } = useModelField();

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
                <Grid.Column
                    span={12}
                    className={style.noComponentsMessage}
                >{t`There are no components that can render this field.`}</Grid.Column>
            </Grid>
        );
    }

    useEffect(() => {
        // If the currently selected render plugin is no longer available, select the first available one.
        if (selectedPlugin) {
            return;
        }

        if (renderers[0]) {
            rendererName.onChange(renderers[0].renderer.rendererName);
            return;
        }

        console.info(`No renderers for field ${field.fieldId} found.`, field);
    }, [field.id, field.list, field.predefinedValues?.enabled, selectedPlugin]);

    return (
        <>
            <Grid>
                <>
                    <Grid.Column span={12}>
                        <Heading level={5}>Field renderer</Heading>
                        <Text size={"sm"}>Choose a component that will render the field.</Text>
                    </Grid.Column>
                    <Grid.Column span={12}>
                        <div className={"mb-xl"}>
                            <RadioGroup
                                {...rendererName}
                                items={renderers.map(item => ({
                                    id: item.renderer.rendererName,
                                    value: item.renderer.rendererName,
                                    label: (
                                        <div>
                                            <Text as={"div"} size={"md"}>
                                                {item.renderer.name}
                                            </Text>
                                            <Text
                                                as={"div"}
                                                size={"sm"}
                                                className={"text-sm text-neutral-strong"}
                                            >
                                                {item.renderer.description}
                                            </Text>
                                        </div>
                                    )
                                }))}
                            />
                        </div>
                    </Grid.Column>
                    <RendererOptions plugin={selectedPlugin} />
                </>
            </Grid>
        </>
    );
};

export default AppearanceTab;
