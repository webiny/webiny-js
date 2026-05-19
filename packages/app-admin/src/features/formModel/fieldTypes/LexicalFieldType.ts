import { FieldType, type IFieldTypeFactory, type IFieldBuilder } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";
import type { RichTextValueWithHtml } from "~/components/LexicalEditor/lexicalValueWithHtml.js";

export class LexicalFieldBuilder extends FieldBuilder<"lexical"> {
    constructor() {
        super("lexical");
        this._config.renderer = "lexical";
    }
}

class LexicalFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "lexical";
    create(_registry: any) {
        return new LexicalFieldBuilder();
    }
}

export const LexicalFieldType = FieldType.createImplementation({
    implementation: LexicalFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        lexical(): IFieldBuilder<"lexical", false, RichTextValueWithHtml | null>;
    }
}
