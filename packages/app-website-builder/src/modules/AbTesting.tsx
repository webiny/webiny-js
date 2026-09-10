import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { ExperimentsFeature } from "~/features/experiments/index.js";
import { ExperimentsEditorPresenterFeature } from "~/presentation/experiments/ExperimentsEditor/index.js";
import { ExperimentsManagerPresenterFeature } from "~/presentation/experiments/ExperimentsManager/index.js";
import { ExperimentFormPresenterFeature } from "~/presentation/experiments/ExperimentForm/index.js";
import { ExperimentsEditorConfig } from "~/presentation/experiments/config/ExperimentsEditorConfig.js";

export const AbTesting = () => {
    return (
        <>
            <RegisterFeature feature={ExperimentsFeature} />
            <RegisterFeature feature={ExperimentsEditorPresenterFeature} />
            <RegisterFeature feature={ExperimentsManagerPresenterFeature} />
            <RegisterFeature feature={ExperimentFormPresenterFeature} />
            <ExperimentsEditorConfig />
        </>
    );
};
