import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Alert, Button, Text } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { FormModelFeature } from "~/features/formModel/feature.js";
import { FormView } from "~/features/formModel/FormView.js";
import type { IFormModel } from "~/features/formModel/abstractions.js";

const RENDERER_NAME = "menuBuilder";

/**
 * PROBE. A field that asks for a renderer nobody wrote.
 *
 * Deliberately passes no `renderers` prop, so `FormView` resolves the name through `AdminConfig`
 * like every other form in the admin. Nothing here knows where `menuBuilder` comes from: until
 * someone asks the assistant for it, the field renders as an unstyled object list, and once the
 * assistant has written one it renders through that instead. That indifference is the point.
 */
export const GeneratedRendererProbeSection = observer(() => {
    const { formModelFactory } = useFeature(FormModelFeature);
    const [form, setForm] = useState<IFormModel | null>(null);

    useEffect(() => {
        setForm(
            formModelFactory.create({
                fields: fields => ({
                    menu: fields
                        .object()
                        .label("Main menu")
                        .list()
                        .renderer(RENDERER_NAME)
                        .fields(inner => ({
                            label: inner.text().label("Label"),
                            url: inner.text().label("URL")
                        }))
                })
            })
        );
    }, [formModelFactory]);

    if (!form) {
        return null;
    }

    return (
        <div className={"flex flex-col gap-lg p-lg"}>
            <Text as={"div"} size={"lg"} className={"font-semibold"}>
                Generated renderer probe
            </Text>

            <Alert variant={"subtle"}>
                {`This field asks for the "${RENDERER_NAME}" renderer. Ask the admin assistant to build one and reload.`}
            </Alert>

            <FormView name={"probe"} form={form.vm} />

            <div>
                <Button
                    text={"Log form data"}
                    variant={"secondary"}
                    size={"sm"}
                    onClick={() => window.alert(JSON.stringify(form.getData(), null, 2))}
                />
            </div>
        </div>
    );
});
