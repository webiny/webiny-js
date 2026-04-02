import React from "react";
import { Plugins } from "@webiny/app";
import { CommandPalette } from "./CommandPalette.js";
import { RegisterFeature } from "~/components/index.js";
import { CommandPaletteFeature } from "~/presentation/commandPalette/feature.js";
import { DeveloperMode } from "~/components/index.js";

export const CommandPaletteExtension = () => {
    return (
        <DeveloperMode>
            <RegisterFeature feature={CommandPaletteFeature} />
            <Plugins>
                <CommandPalette />
            </Plugins>
        </DeveloperMode>
    );
};
