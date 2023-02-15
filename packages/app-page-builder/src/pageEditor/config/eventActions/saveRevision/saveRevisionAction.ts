import gql from "graphql-tag";
import lodashIsEqual from "lodash/isEqual";
import lodashDebounce from "lodash/debounce";
import { SaveRevisionActionArgsType } from "./types";
import { ToggleSaveRevisionStateActionEvent } from "./event";
import { PageAtomType } from "~/pageEditor/state";
import { PageEventActionCallable } from "~/pageEditor/types";
import { PbElement } from "~/types";

interface PageRevisionType extends Pick<PageAtomType, "title" | "snippet" | "path" | "settings"> {
    category: string;
    content: any;
}

let lastSavedRevisionData: PageRevisionType | unknown = undefined;

const isDataEqualToLastSavedData = (data: PageRevisionType) => {
    return lodashIsEqual(data, lastSavedRevisionData);
};

const triggerOnFinish = (args?: SaveRevisionActionArgsType): void => {
    if (!args || !args.onFinish || typeof args.onFinish !== "function") {
        return;
    }
    args.onFinish();
};
// TODO @ts-refactor not worth it
let debouncedSave: any = null;

const syncTemplateVariables = (content: PbElement) => {
    const templateVariables = [];

    for (const block of content.elements) {
        if (block.data.variables?.length > 0) {
            templateVariables.push({
                blockId: block.data.templateBlockId,
                variables: block.data.variables
            });
        }
    }

    return { ...content, data: { ...content.data, templateVariables }, elements: [] };
};

const removeTemplateBlockIds = (content: PbElement) => {
    const blocks = content.elements.map(block => {
        // we need to drop templateBlockId property, when block is no longer inside template
        // we also remove variables from unlinked blocks, since they don't need them outside template
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { templateBlockId, variables, ...blockData } = block.data;
        if (block.data.blockId) {
            return {
                ...block,
                data: { ...blockData, variables }
            };
        } else {
            return {
                ...block,
                data: blockData
            };
        }
    });

    return { ...content, elements: blocks };
};

export const saveRevisionAction: PageEventActionCallable<SaveRevisionActionArgsType> = async (
    state,
    meta,
    args = {}
) => {
    if (state.page.locked) {
        return {
            actions: []
        };
    }

    let updatedContent = (await state.getElementTree()) as PbElement;

    if (updatedContent.data.templateId) {
        updatedContent = syncTemplateVariables(updatedContent);
    } else {
        updatedContent = removeTemplateBlockIds(updatedContent);
    }

    const data: PageRevisionType = {
        title: state.page.title,
        snippet: state.page.snippet,
        path: state.page.path,
        settings: state.page.settings,
        content: updatedContent,
        category: state.page.category ? state.page.category.slug : ""
    };

    if (isDataEqualToLastSavedData(data)) {
        triggerOnFinish(args);
        return {
            actions: []
        };
    }

    lastSavedRevisionData = data;

    const updatePage = gql`
        mutation updatePage($id: ID!, $data: PbUpdatePageInput!) {
            pageBuilder {
                updatePage(id: $id, data: $data) {
                    data {
                        id
                        content
                        title
                        status
                        savedOn
                    }
                    error {
                        code
                        message
                        data
                    }
                }
            }
        }
    `;

    if (debouncedSave) {
        debouncedSave.cancel();
    }

    const runSave = async () => {
        meta.eventActionHandler.trigger(new ToggleSaveRevisionStateActionEvent({ saving: true }));

        await meta.client.mutate({
            mutation: updatePage,
            variables: {
                id: state.page.id,
                data
            }
        });

        meta.eventActionHandler.trigger(new ToggleSaveRevisionStateActionEvent({ saving: false }));
        triggerOnFinish(args);
    };

    if (args && args.debounce === false) {
        /**
         * TODO @ts-refactor should we await for this to finish?
         */
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
