import React from "react";
import { Project } from "webiny/extensions";

export default () => (
    <Project.FeatureFlags
        features={{
            aiPowerups: false,
            fileManager: {
                threatDetection: false
            },
            recordLocking: false
        }}
    />
);
