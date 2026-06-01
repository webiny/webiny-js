import React from "react";
import { observer } from "mobx-react-lite";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import type { ISingletonEntryPresenter } from "../singleton/abstractions.js";

interface SingletonEntryLayoutProps {
    presenter: ISingletonEntryPresenter;
}

export const SingletonEntryLayout = observer(({ presenter }: SingletonEntryLayoutProps) => {
    const { vm, actions } = presenter;

    if (vm.loading) {
        return <div>{vm.loading}</div>;
    }

    if (!vm.form) {
        return null;
    }

    return (
        <div>
            <div>
                {vm.canSave && (
                    <button onClick={() => actions.save()} disabled={vm.loading !== null}>
                        Save
                    </button>
                )}
            </div>
            <FormView name="SingletonEntryForm" form={vm.form} />
        </div>
    );
});
