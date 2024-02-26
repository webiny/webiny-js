// When we stop supporting the legacy rendering engine, we'll move this component into `app-website` package.
// For now, we'll just re-export it, so developers can import it from `app-website` in their code.
import BaseWebsiteScripts from "@webiny/app-page-builder/render/components/WebsiteScripts";
import { makeDecoratable } from "@webiny/app";

export const WebsiteScripts = makeDecoratable("WebsiteScripts", BaseWebsiteScripts);
