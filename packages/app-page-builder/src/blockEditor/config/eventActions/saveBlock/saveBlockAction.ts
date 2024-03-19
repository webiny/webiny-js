import lodashDebounce from "lodash/debounce";
import { plugins } from "@webiny/plugins";
import { SaveBlockActionArgsType } from "./types";
import { BlockEventActionCallable } from "~/blockEditor/types";
import { PbElement, PbBlockVariable, PbBlockEditorCreateVariablePlugin } from "~/types";
import { UpdatePageBlockInput } from "~/admin/contexts/AdminPageBuilder/PageBlocks/BlockGatewayInterface";

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

/**
 * This logic is necessary to collect the latest element state and generate up-to-date variable values.
 * Otherwise, we might have outdated values in variables. For example: we link a `button` element, and then
 * update the button label through the Styles tab. This update is not reflected directly on the default variable
 * value. On block save, the variable value would be still outdated, if this `syncBlockVariables` is not executed.
 *
 * TODO: Ideally, we would update variable values as the element state itself gets updated, to avoid this entire piece of logic.
 */
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
    args
) => {
    // TODO: make sure the API call is not sent if the data was not changed since the last invocation of this event.
    // See `pageEditor` for an example and feel free to copy that same logic over here.
    const element = (await state.getElementTree()) as PbElement;

    const data: UpdatePageBlockInput = {
        id: state.block.id,
        name: state.block.name,
        blockCategory: state.block.blockCategory,
        // We need to grab the contents of the "document" element, and we can safely just grab the first element
        // because we only have 1 block in the block editor.
        content: syncBlockVariables(element.elements[0])
    };

    if (debouncedSave) {
        debouncedSave.cancel();
    }

    const runSave = async () => {
        await args?.execute(data);

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
