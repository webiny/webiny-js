import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { FormErrors } from "@webiny/app-admin";
import { FormView } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";

export const ContentEntryForm = makeDecoratable(
    "ContentEntryForm",
    createReactiveComponent(() => {
        const presenter = useContentEntryFormPresenter();
        const vm = presenter.vm;

        if (!vm.form) {
            return null;
        }

        return (
            <>
                <FormErrors form={vm.form} className={"mb-md"} />
                <FormView name="ContentEntryForm" form={vm.form} />
            </>
        );
    })
);
