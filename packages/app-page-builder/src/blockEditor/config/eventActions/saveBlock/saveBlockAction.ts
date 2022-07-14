// import gql from "graphql-tag";
import lodashDebounce from "lodash/debounce";
import { SaveBlockActionArgsType } from "./types";
import { ToggleSaveBlockStateActionEvent } from "./event";
import { BlockEventActionCallable } from "~/blockEditor/types";
import { BlockWithContent } from "~/blockEditor/state";

// TODO: add more properties here
type BlockType = Pick<BlockWithContent, "title" | "content">;

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

    const data: BlockType = {
        title: state.block.title,
        content: await state.getElementTree()
    };

    // const updateBlock = gql`
    //     mutation updateBlock($id: ID!, $data: PbUpdateBlockInput!) {
    //         pageBuilder {
    //             updateBlock(id: $id, data: $data) {
    //                 data {
    //                     id
    //                     content
    //                     title
    //                     status
    //                     savedOn
    //                 }
    //                 error {
    //                     code
    //                     message
    //                     data
    //                 }
    //             }
    //         }
    //     }
    // `;

    if (debouncedSave) {
        debouncedSave.cancel();
    }

    const runSave = async () => {
        meta.eventActionHandler.trigger(new ToggleSaveBlockStateActionEvent({ saving: true }));

        // await meta.client.mutate({
        //     mutation: updateBlock,
        //     variables: {
        //         id: state.block.id,
        //         data
        //     }
        // });

        await new Promise(resolve => {
            console.log("Saving block", data);
            setTimeout(resolve, 500);
        });

        meta.eventActionHandler.trigger(new ToggleSaveBlockStateActionEvent({ saving: false }));
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
