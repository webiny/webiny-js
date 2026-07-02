import React, { useCallback } from "react";
import { useFeature, createReactiveComponent } from "webiny/admin";
import { useContentEntryFormPresenter } from "webiny/admin/cms/entry/editor";
import { FormView, FormErrors } from "webiny/admin/form";
import { Button } from "webiny/admin/ui";
import { WizardFormPresenterFeature } from "./WizardFormPresenter.js";

export const WizardForm = createReactiveComponent(() => {
    const { presenter } = useFeature(WizardFormPresenterFeature);
    const formPresenter = useContentEntryFormPresenter();

    const handleSubmit = useCallback(async () => {
        const data = await presenter.submit();
        if (data !== false) {
            // Remap data for the actual entry form
            formPresenter.newEntry({
                title: data.title,
                description: data.description,
                settings: {
                    internalTitle: data.title
                }
            });
        }
    }, [presenter, formPresenter]);

    const { form } = presenter.vm;

    return (
        <div className="flex justify-center pt-xl">
            <div
                className="bg-neutral-base rounded-lg p-lg flex flex-col gap-md"
                style={{ width: 600 }}
            >
                <h3 className="text-lg font-semibold">New Article Wizard</h3>
                <p className={"text-neutral-muted"}>
                    This is a demo extension for "article" model.
                    <br />
                    Disable it in webiny.config.tsx if it's getting in your way.
                </p>
                <FormErrors form={form} />
                <FormView name="NewEntryWizard" form={form} />
                <div className="flex justify-end gap-sm">
                    <Button variant="primary" onClick={handleSubmit}>
                        Create Entry
                    </Button>
                </div>
            </div>
        </div>
    );
});
