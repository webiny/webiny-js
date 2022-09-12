import invariant from "invariant";
import { plugins } from "@webiny/plugins";
import { getNanoid, addElementId } from "~/editor/helpers";
import { PbEditorBlockPlugin, PbEditorElement } from "~/types";

export const createBlockReference = (name: string): PbEditorElement => {
    const plugin = plugins.byName<PbEditorBlockPlugin>(name);

    invariant(plugin, `Missing block plugin "${name}"!`);
    /**
     * Used ts-ignore because TS is complaining about always overriding some properties
     */

    const blockElement = addElementId(plugin.create());
    return {
        // @ts-ignore
        id: getNanoid(),
        // @ts-ignore
        elements: [],
        ...blockElement,
        // @ts-ignore
        data: { ...blockElement.data, blockId: plugin.id }
    };
};
