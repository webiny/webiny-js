// import gql from "graphql-tag";
import lodashDebounce from "lodash/debounce";
import { plugins } from "@webiny/plugins";
import { SaveBlockActionArgsType } from "./types";
import { BlockEventActionCallable } from "~/blockEditor/types";
import { BlockWithContent } from "~/blockEditor/state";
import { UPDATE_PAGE_BLOCK } from "~/admin/views/PageBlocks/graphql";
import { getPreviewImage } from "./getPreviewImage";
import { removeElementId } from "~/editor/helpers";
import { PbElement, PbBlockVariable, PbBlockEditorCreateVariablePlugin } from "~/types";

export const findElementByVariableId = (elements: PbElement[], variableId: string): any => {
    for (const element of elements) {
        if (element.data?.variableId === variableId) {
            return element;
        }
        if (element.elements?.length > 0) {
            const found = findElementByVariableId(element.elements, variableId);
            if (found) {
                return found;
            }
        }
    }
};

const syncBlockVariables = (block: PbElement) => {
    const createVariablePlugins = plugins.byType<PbBlockEditorCreateVariablePlugin>(
        "pb-block-editor-create-variable"
    );

    const syncedVariables = block.data?.variables?.reduce(function (
        result: Array<PbBlockVariable>,
        variable: PbBlockVariable
    ) {
        const element = findElementByVariableId(block.elements, variable.id.split(".")[0]);
        const createVariablePlugin = createVariablePlugins.find(
            plugin => plugin.elementType === element?.type
        );

        if (createVariablePlugin) {
            result.push({
                ...variable,
                value: createVariablePlugin.getVariableValue({ element, variableId: variable.id })
            });
        }

        return result;
    },
    []);

    return { ...block, data: { ...block.data, variables: syncedVariables } };
};

// TODO: add more properties here
type BlockType = Pick<BlockWithContent, "name" | "content" | "blockCategory">;

const triggerOnFinish = (args?: SaveBlockActionArgsType): void => {
    if (!args || !args.onFinish || typeof args.onFinish !== "function") {
        return;
    }
    args.onFinish();
};
// Setting to `any` as this is not at all important.
let debouncedSave: any = null;

export const saveBlockAction: BlockEventActionCallable<SaveBlockActionArgsType> = async (
    state,
    meta,
    args = {}
) => {
    // TODO: make sure the API call is not sent if the data was not changed since the last invocation of this event.
    // See `pageEditor` for an example and feel free to copy that same logic over here.
    const element = (await state.getElementTree()) as PbElement;
    // We need to grab the first block from the "document" element.
    const createdImage = await getPreviewImage(element.elements[0], meta, state.block?.preview?.id);

    const data: BlockType = {
        name: state.block.name,
        blockCategory: state.block.blockCategory,
        // We need to grab the contents of the "document" element, and we can safely just grab the first element
        // because we only have 1 block in the block editor.
        content: removeElementId(syncBlockVariables(element.elements[0]))
    };

    if (debouncedSave) {
        debouncedSave.cancel();
    }

    const runSave = async () => {
        await meta.client.mutate({
            mutation: UPDATE_PAGE_BLOCK,
            variables: {
                id: state.block.id,
                data: {
                    ...data,
                    preview: createdImage
                }
            }
        });

        await new Promise(resolve => {
            setTimeout(resolve, 500);
        });

        triggerOnFinish(args);
    };

    if (args && args.debounce === false) {
        runSave();
        return {
            actions: []
        };
    }

    debouncedSave = lodashDebounce(runSave, 2000);
    debouncedSave();

    return {
        actions: []
    };
};
