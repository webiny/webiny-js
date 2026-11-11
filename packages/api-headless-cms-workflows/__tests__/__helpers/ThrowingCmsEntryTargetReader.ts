import type { Container } from "@webiny/di";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";

class ThrowingTargetReader implements CmsEntryTargetReader.Interface {
    public constructor(private decoratee: CmsEntryTargetReader.Interface) {}

    public async read(): Promise<CmsEntryTargetReader.Target | null> {
        throw new Error("Storage is down.");
    }

    public async readMany(): Promise<CmsEntryTargetReader.Target[]> {
        throw new Error("Storage is down.");
    }
}

class MalformedModelTargetReader implements CmsEntryTargetReader.Interface {
    public constructor(private decoratee: CmsEntryTargetReader.Interface) {}

    public async read(
        params: CmsEntryTargetReader.Params
    ): Promise<CmsEntryTargetReader.Target | null> {
        const target = await this.decoratee.read(params);
        if (!target) {
            return null;
        }
        // A model whose `fields` is gone: `toEditorFields` throws on it.
        return { ...target, model: { ...target.model, fields: undefined as never } };
    }

    public async readMany(
        params: CmsEntryTargetReader.ManyParams
    ): Promise<CmsEntryTargetReader.Target[]> {
        return this.decoratee.readMany(params);
    }
}

/** Makes every target read return a model with no `fields` (`legacyPlugins`). */
export const malformedModelCmsEntryTargetReader = (container: Container) => {
    container.registerDecorator(
        CmsEntryTargetReader.createDecorator({
            decorator: MalformedModelTargetReader,
            dependencies: []
        })
    );
};

/** Makes every target read throw (`legacyPlugins`). Entry creation does not use the reader. */
export const throwingCmsEntryTargetReader = (container: Container) => {
    container.registerDecorator(
        CmsEntryTargetReader.createDecorator({ decorator: ThrowingTargetReader, dependencies: [] })
    );
};
