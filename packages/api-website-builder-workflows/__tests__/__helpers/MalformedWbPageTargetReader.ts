import type { Container } from "@webiny/di";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";

class MalformedWbPageTargetReader implements WbPageTargetReader.Interface {
    public constructor(private decoratee: WbPageTargetReader.Interface) {}

    public async read(
        params: WbPageTargetReader.Params
    ): Promise<WbPageTargetReader.Target | null> {
        const target = await this.decoratee.read(params);
        if (!target) {
            return null;
        }
        // A page whose `properties` is gone: `toWbPageEditorFields` throws on it.
        return { ...target, page: { ...target.page, properties: undefined as never } };
    }

    public async readMany(
        params: WbPageTargetReader.ManyParams
    ): Promise<WbPageTargetReader.Target[]> {
        return this.decoratee.readMany(params);
    }
}

/** Makes every target read return a page with no `properties` (`legacyPlugins`). */
export const malformedWbPageTargetReader = (container: Container) => {
    container.registerDecorator(
        WbPageTargetReader.createDecorator({
            decorator: MalformedWbPageTargetReader,
            dependencies: []
        })
    );
};
