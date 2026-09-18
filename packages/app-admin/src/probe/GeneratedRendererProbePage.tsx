import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Alert, Button, Loader, Text } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { FormModelFeature } from "~/features/formModel/feature.js";
import { FormView } from "~/features/formModel/FormView.js";
import type { IFormModel, IFieldVM } from "~/features/formModel/abstractions.js";
import { GENERATED_SOURCE } from "./GENERATED_SOURCE.js";
import { bundleRenderer } from "./bundleRenderer.js";
import { createRendererRuntime, loadRenderer } from "./rendererRuntime.js";

/**
 * PROBE. Generated source in, working field renderer out, with no build step in between.
 *
 * The point is the round trip: a string that never went through the repo's compiler is bundled in
 * the browser, evaluated, handed the admin's own React and design system, and rendered against a
 * real `FormModel`. If this works, the remaining questions are storage and trust, not feasibility.
 */
export const GeneratedRendererProbeSection = observer(() => {
    const { formModelFactory } = useFeature(FormModelFeature);
    const [form, setForm] = useState<IFormModel | null>(null);
    const [renderers, setRenderers] = useState<Record<
        string,
        React.ComponentType<{ field: IFieldVM }>
    > | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setForm(
            formModelFactory.create({
                fields: fields => ({
                    menu: fields
                        .object()
                        .label("Main menu")
                        .list()
                        .renderer("menuBuilder")
                        .fields(inner => ({
                            label: inner.text().label("Label"),
                            url: inner.text().label("URL")
                        }))
                })
            })
        );
    }, [formModelFactory]);

    useEffect(() => {
        let cancelled = false;

        bundleRenderer(GENERATED_SOURCE)
            .then(({ bundled }) => {
                const component = loadRenderer(bundled, createRendererRuntime());
                if (!cancelled) {
                    setRenderers({ menuBuilder: component });
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : String(err));
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className={"flex flex-col gap-lg p-lg"}>
            <Text as={"div"} size={"lg"} className={"font-semibold"}>
                Generated renderer probe
            </Text>

            {error ? <Alert variant={"strong"}>{error}</Alert> : null}

            {!form || !renderers ? (
                <Loader />
            ) : (
                <>
                    <FormView name={"probe"} form={form.vm} renderers={renderers} />
                    <div>
                        <Button
                            text={"Log form data"}
                            variant={"secondary"}
                            size={"sm"}
                            onClick={() => window.alert(JSON.stringify(form.getData(), null, 2))}
                        />
                    </div>
                </>
            )}
        </div>
    );
});
