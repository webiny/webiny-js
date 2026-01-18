import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
// @ts-expect-error Unable to resolve types
import { compiler } from "markdown-to-jsx/react";
import { useFeature } from "@webiny/app";
import { OverlayLoader } from "@webiny/admin-ui";
import { markdownComponents } from "./markdownComponents.js";
import { NextjsConfigFeature } from "./feature.js";

export const NextjsConfig = observer(() => {
    const { presenter } = useFeature(NextjsConfigFeature);

    useEffect(() => {
        presenter.init();
    }, []);

    const vm = presenter.vm;

    if (vm.loading) {
        return <OverlayLoader text={"Loading config..."} />;
    }

    if (!vm.config) {
        return null;
    }

    return <>{compiler(vm.config, { overrides: markdownComponents })}</>;
});
