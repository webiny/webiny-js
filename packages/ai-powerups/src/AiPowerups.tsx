import React from "react";
import { Api, Admin } from "@webiny/project-aws";

/**
 * Both extensions load unconditionally; each gates itself at runtime.
 *
 * This used to sit inside `FeatureFlag.CanUseAiPowerups`, which reads project config while the
 * project graph is built, so the decision was baked in at deploy time. A WCP licence that granted
 * AI Power-Ups therefore did nothing until the next deploy, which is the wrong shape for something
 * a customer can buy at any moment.
 *
 * The gate now lives where the licence is readable: `api/Extension.ts` checks the effective flags
 * at `register()` (the licence is refreshed per request, before any feature registers), and
 * `admin/Extension.tsx` checks them on render. `ai-chat` and `api-aco` already gate this way.
 */
export const AiPowerups = () => {
    return (
        <>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
