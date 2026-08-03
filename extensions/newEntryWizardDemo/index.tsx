import React from "react";
import { RegisterFeature } from "webiny/admin";
import { ContentEntryEditorConfig } from "webiny/admin/cms/entry/editor";
import { WizardFormPresenterFeature } from "./WizardFormPresenter.js";
import { WizardForm } from "./WizardForm.js";

const NewEntryWizardDemo = () => {
    return (
        <>
            <RegisterFeature feature={WizardFormPresenterFeature} />
            <ContentEntryEditorConfig>
                <ContentEntryEditorConfig.NewEntryWizard
                    name={"newEntryWizardDemo"}
                    element={<WizardForm />}
                    modelIds={["article"]}
                />
            </ContentEntryEditorConfig>
        </>
    );
};

export default NewEntryWizardDemo;
