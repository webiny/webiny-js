import { createFeature } from "@webiny/feature/api";
import { WbTranslatePageDecorator } from "./WbTranslatePageDecorator.js";
import { LexicalParser } from "./LexicalParser.js";
import { WbTranslatePageCapability } from "./capability.js";

export const WbTranslatePageFeature = createFeature({
    name: "AiPowerUps/WbTranslatePage",
    register(container) {
        container.register(WbTranslatePageCapability);
        container.register(LexicalParser).inSingletonScope();
        container.registerDecorator(WbTranslatePageDecorator);
    }
});
