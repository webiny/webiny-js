import React from "react";
import { useFeature } from "@webiny/app";
import { AssistantComposerControlsFeature } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";

/**
 * The controls the screen the user is on put above the question box, such as the page editor's
 * project and persona pickers. Nothing on a screen that adds none.
 */
const ComposerControlsBase = () => {
    const { composerControls } = useFeature(AssistantComposerControlsFeature);
    const controls = composerControls.list();

    if (controls.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-xs">
            {controls.map(control => (
                <React.Fragment key={control.name}>{control.element}</React.Fragment>
            ))}
        </div>
    );
};

export const ComposerControls = createReactiveComponent(ComposerControlsBase);
