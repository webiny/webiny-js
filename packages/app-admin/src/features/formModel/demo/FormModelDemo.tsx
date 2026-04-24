import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { FormView } from "../FormView.js";
import { FormModelFeature } from "../feature.js";
import { FormModelDemoPresenter } from "./FormModelDemoPresenter.js";

export const FormModelDemo = observer(() => {
    const { formModelFactory } = useFeature(FormModelFeature);
    const presenter = useMemo(
        () => new FormModelDemoPresenter(formModelFactory),
        [formModelFactory]
    );

    const { form, data, lastSubmitted, isSubmitting } = presenter.vm;

    return (
        <div className={"p-lg flex flex-col gap-lg max-w-4xl mx-auto"}>
            <div className={"flex flex-col gap-sm"}>
                <h2 className={"text-xl font-semibold"}>FormModel Demo — Phase 8a</h2>
                <p className={"text-sm text-neutral-strong"}>
                    Single-object templates. Pick a template from the dropdown inside the
                    &quot;Content Block&quot; field and observe the form reshape. Change Plan to{" "}
                    <code>enterprise</code> to see the &quot;Premium Widget&quot; template appear
                    in the picker.
                </p>
            </div>

            <FormView form={form} />

            <div className={"flex gap-sm"}>
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
