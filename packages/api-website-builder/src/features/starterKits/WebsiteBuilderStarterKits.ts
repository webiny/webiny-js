import { StarterKitsProvider } from "@webiny/frontend-settings/api/features/starterKits/abstractions.js";
import type { IStarterKit } from "@webiny/frontend-settings/shared/types.js";
import { NextjsConfig } from "~/features/nextjs/abstractions.js";
import { NuxtConfig } from "~/features/nuxt/abstractions.js";

/**
 * Contributes the Website Builder starter kits (Next.js and Nuxt) to the
 * Frontend Settings dialog. Registered as a decorator so that other packages
 * can contribute their own kits without any of them knowing about each other.
 */
class WebsiteBuilderStarterKitsImpl implements StarterKitsProvider.Interface {
    constructor(
        private nextjsConfig: NextjsConfig.Interface,
        private nuxtConfig: NuxtConfig.Interface,
        private decoratee: StarterKitsProvider.Interface
    ) {}

    async execute(): Promise<IStarterKit[]> {
        const [existing, nextjs, nuxt] = await Promise.all([
            this.decoratee.execute(),
            this.nextjsConfig.execute(),
            this.nuxtConfig.execute()
        ]);

        return [
            ...existing,
            { id: "nextjs", label: "Next.js", config: nextjs.build() },
            { id: "nuxt", label: "Nuxt", config: nuxt.build() }
        ];
    }
}

export const WebsiteBuilderStarterKits = StarterKitsProvider.createDecorator({
    decorator: WebsiteBuilderStarterKitsImpl,
    dependencies: [NextjsConfig, NuxtConfig]
});
