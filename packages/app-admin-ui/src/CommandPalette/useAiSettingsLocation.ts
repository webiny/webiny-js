import { useContainer } from "@webiny/app";
import { AiSettingsLocation } from "@webiny/app-admin";

/**
 * Where AI settings are changed, or nothing when no installed package provides that screen.
 *
 * Read on each render rather than injected once, because the package that provides it registers
 * its features while the admin renders, after the assistant may already exist.
 */
export const useAiSettingsLocation = (): AiSettingsLocation.Interface | undefined => {
    const container = useContainer();
    return container.resolveAll(AiSettingsLocation)[0];
};
