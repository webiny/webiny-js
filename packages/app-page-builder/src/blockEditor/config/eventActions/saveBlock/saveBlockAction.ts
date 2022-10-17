// import gql from "graphql-tag";
import lodashDebounce from "lodash/debounce";
import { SaveBlockActionArgsType } from "./types";
import { ToggleSaveBlockStateActionEvent } from "./event";
import { BlockEventActionCallable } from "~/blockEditor/types";
import { BlockWithContent } from "~/blockEditor/state";
import { UPDATE_PAGE_BLOCK } from "~/admin/views/PageBlocks/graphql";
import getPreviewImage from "./getPreviewImage";
import { removeElementId } from "~/editor/helpers";
import { PbElement, PbElementDataType, PbBlockVariable } from "~/types";

function findNestedObj(
    entireObj: PbElement[],
    keyToFind: string,
    valToFind: string
): PbElementDataType | undefined {
    let foundObj;
    JSON.stringify(entireObj, (_, nestedValue) => {
        if (nestedValue && nestedValue[keyToFind] === valToFind) {
            foundObj = nestedValue;
        }
        return nestedValue;
    });
    return foundObj;
}

const syncBlockVariables = (block: PbElement) => {
    const syncedVariables = block.data?.variables?.reduce(function (
        result: Array<PbBlockVariable>,
        variable: PbBlockVariable
    ) {
        const dataObject = findNestedObj(block.elements, "variableId", variable.id);

        if (dataObject) {
            result.push({ ...variable, value: dataObject?.text?.data?.text });
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
    const createdImage = await getPreviewImage(element.elements[0], meta);

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
        meta.eventActionHandler.trigger(new ToggleSaveBlockStateActionEvent({ saving: true }));

        await meta.client.mutate({
            mutation: UPDATE_PAGE_BLOCK,
            variables: {
                id: state.block.id,
                data: {
                    ...data,
                    preview: createdImage.data
                }
            }
        });

        await new Promise(resolve => {
            console.log("Saving block", data);
            setTimeout(resolve, 500);
        });

        await meta.eventActionHandler.trigger(
            new ToggleSaveBlockStateActionEvent({ saving: false })
        );
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
