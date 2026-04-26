import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { FormView } from "../FormView.js";
import { FormModelFeature } from "../feature.js";
import { FormModelDemoPresenter } from "./FormModelDemoPresenter.js";
import { FormModelPhase8c1Presenter } from "./FormModelPhase8c1Presenter.js";
import { FormModelPhase11Presenter } from "./FormModelPhase11Presenter.js";

export const FormModelDemo = observer(() => {
    const { formModelFactory } = useFeature(FormModelFeature);
    const presenter = useMemo(
        () => new FormModelDemoPresenter(formModelFactory),
        [formModelFactory]
    );

    const { form, data, lastSubmitted, isSubmitting, runtimeTemplateAdded, textTemplateRemoved } =
        presenter.vm;

    return (
        <div className={"p-lg flex flex-col gap-2xl max-w-4xl mx-auto"}>
            <div className={"flex flex-col gap-lg"}>
                <div className={"flex flex-col gap-sm"}>
                    <h2 className={"text-xl font-semibold"}>FormModel Demo — Phase 8</h2>
                    <p className={"text-sm text-neutral-strong"}>
                        Exercises the full Phase 8 surface: single-object templates (&quot;Content
                        Block&quot;), templated lists (&quot;Page Sections&quot;), per-template
                        layouts (Hero spans two rows; Rich Text uses a single row; templates without
                        a layout entry fall back to default), and runtime template management via{" "}
                        <code>field.templates.add/remove</code>. Change Plan to{" "}
                        <code>enterprise</code> to reveal the &quot;Premium Widget&quot; template in
                        the Content Block picker.
                    </p>
                </div>

                <FormView form={form} />

                <div className={"flex flex-wrap gap-sm"}>
                    <Button
                        text={isSubmitting ? "Submitting…" : "Submit"}
                        variant={"primary"}
                        onClick={() => presenter.submit()}
                        disabled={isSubmitting}
                    />
                    <Button
                        text={"Reset"}
                        variant={"secondary"}
                        onClick={() => presenter.reset()}
                        disabled={isSubmitting}
                    />
                    <Button
                        text={
                            runtimeTemplateAdded
                                ? 'Remove "Runtime Banner" from sections'
                                : 'Add "Runtime Banner" to sections'
                        }
                        variant={"tertiary"}
                        onClick={() => presenter.toggleRuntimeTemplate()}
                    />
                    <Button
                        text={
                            textTemplateRemoved
                                ? 'Restore "Rich Text" on content'
                                : 'Remove "Rich Text" from content'
                        }
                        variant={"tertiary"}
                        onClick={() => presenter.toggleTextTemplate()}
                    />
                </div>

                <div className={"grid grid-cols-2 gap-md"}>
                    <DataPanel title={"Current getData()"} data={data} />
                    <DataPanel title={"Last submitted"} data={lastSubmitted} />
                </div>
            </div>

            <Phase8c1Section />

            <Phase11Section />
        </div>
    );
});

const Phase8c1Section = observer(() => {
    const { formModelFactory } = useFeature(FormModelFeature);
    const presenter = useMemo(
        () => new FormModelPhase8c1Presenter(formModelFactory),
        [formModelFactory]
    );

    const { form, data, lastSubmitted, isSubmitting } = presenter.vm;

    return (
        <div className={"flex flex-col gap-lg border-t border-neutral-dimmed pt-lg"}>
            <div className={"flex flex-col gap-sm"}>
                <h2 className={"text-xl font-semibold"}>FormModel Demo — Phase 8c.1</h2>
                <p className={"text-sm text-neutral-strong"}>
                    Nested object layouts. A top-level <code>page</code> object whose inner layout
                    is split across tabs (General / SEO). The SEO tab contains a nested{" "}
                    <code>layout.object(&quot;seo&quot;, ...)</code> with its own row layout, and
                    the SEO object itself contains another nested{" "}
                    <code>layout.object(&quot;og&quot;, ...)</code> for the Open Graph fields. Phase
                    8c.1 walks the inner layout (including across tabs) and forwards each nested{" "}
                    <code>layout.object()</code> to the matching child at build time.
                </p>
            </div>

            <FormView form={form} />

            <div className={"flex flex-wrap gap-sm"}>
                <Button
                    text={isSubmitting ? "Submitting…" : "Submit"}
                    variant={"primary"}
                    onClick={() => presenter.submit()}
                    disabled={isSubmitting}
                />
                <Button
                    text={"Reset"}
                    variant={"secondary"}
                    onClick={() => presenter.reset()}
                    disabled={isSubmitting}
                />
            </div>

            <div className={"grid grid-cols-2 gap-md"}>
                <DataPanel title={"Current getData()"} data={data} />
                <DataPanel title={"Last submitted"} data={lastSubmitted} />
            </div>
        </div>
    );
});

const Phase11Section = observer(() => {
    const { formModelFactory } = useFeature(FormModelFeature);
    const presenter = useMemo(
        () => new FormModelPhase11Presenter(formModelFactory),
        [formModelFactory]
    );

    const { form, data, lastSubmitted, isSubmitting, formErrors } = presenter.vm;

    return (
        <div className={"flex flex-col gap-lg border-t border-neutral-dimmed pt-lg"}>
            <div className={"flex flex-col gap-sm"}>
                <h2 className={"text-xl font-semibold"}>FormModel Demo — Phase 11</h2>
                <p className={"text-sm text-neutral-strong"}>
                    Conditional required (<code>requiredWhen</code> on Seats — chained builder +
                    modifier rules), derived fields (<code>computed</code> Full Name and{" "}
                    <code>computedUntilDirty</code> Slug), modifier-style child addition via{" "}
                    <code>field.as(&quot;object&quot;).fields()</code> adding Company/Bio to
                    Profile, form-level rules (<code>addRule</code> with a Zod refinement for
                    password match plus an imperative slug-length rule), and a layout assembled via{" "}
                    <code>setLayout</code>.
                </p>
            </div>

            <FormView form={form} />

            {formErrors.length > 0 && (
                <div className={"flex flex-col gap-xs"}>
                    <div className={"text-sm font-medium"}>Form errors</div>
                    <ul className={"text-xs text-error-strong list-disc pl-md"}>
                        {formErrors.map((e, i) => (
                            <li key={i}>
                                {e.path ? <code>{e.path}</code> : null} {e.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className={"flex flex-wrap gap-sm"}>
                <Button
                    text={isSubmitting ? "Submitting…" : "Submit"}
                    variant={"primary"}
                    onClick={() => presenter.submit()}
                    disabled={isSubmitting}
                />
                <Button
                    text={"Reset"}
                    variant={"secondary"}
                    onClick={() => presenter.reset()}
                    disabled={isSubmitting}
                />
            </div>

            <div className={"grid grid-cols-2 gap-md"}>
                <DataPanel title={"Current getData()"} data={data} />
                <DataPanel title={"Last submitted"} data={lastSubmitted} />
            </div>
        </div>
    );
});

const DataPanel = ({ title, data }: { title: string; data: unknown }) => {
    return (
        <div className={"flex flex-col gap-xs"}>
            <div className={"text-sm font-medium"}>{title}</div>
            <pre
                className={
                    "text-xs bg-neutral-subtle p-sm rounded border border-neutral-dimmed overflow-auto"
                }
            >
                {data === null ? "null" : JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
};
