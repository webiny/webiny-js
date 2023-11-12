import gql from "graphql-tag";
import lodashIsEqual from "lodash/isEqual";
import lodashGet from "lodash/get";
import lodashDebounce from "lodash/debounce";
import { SaveRevisionActionArgsType, UpdatedPage } from "./types";
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

const triggerOnFinish = (args?: SaveRevisionActionArgsType, page?: UpdatedPage): void => {
    if (!args || !args.onFinish || typeof args.onFinish !== "function") {
        return;
    }
    args.onFinish(page);
};

let debouncedSave: ReturnType<typeof lodashDebounce> | null = null;

const syncTemplateVariables = (content: PbElement) => {
    const templateVariables = [];

    for (const block of content.elements) {
        const variables = block.data.variables ?? [];
        if (variables.length > 0) {
            templateVariables.push({
                blockId: block.data.templateBlockId,
                variables: variables
            });
        }
    }

    const template = { ...content.data.template, variables: templateVariables };

    return { ...content, data: { ...content.data, template }, elements: [] };
};

const removeTemplateBlockIds = (content: PbElement) => {
    const blocks = content.elements.map(block => {
        // we need to drop templateBlockId property, when block is no longer inside template
        // we also remove variables from unlinked blocks, since they don't need them outside template
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { templateBlockId, variables = [], ...blockData } = block.data;
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

const removeSelectedVariantIds = (content: PbElement) => {
    const blocks = content.elements.map(block => {
        if (block.data.isVariantBlock) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { selectedVariantId, ...blockData } = block.data;
            return {
                ...block,
                data: blockData
            };
        } else {
            return block;
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

    if (updatedContent.data.template) {
        updatedContent = syncTemplateVariables(updatedContent);
    } else {
        updatedContent = removeTemplateBlockIds(updatedContent);
    }

    updatedContent = removeSelectedVariantIds(updatedContent);

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
                        path
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

        const updateResponse = await meta.client.mutate({
            mutation: updatePage,
            variables: {
                id: state.page.id,
                data
            }
        });

        const pageFromApi = lodashGet(updateResponse, "data.pageBuilder.updatePage.data", {});

        meta.eventActionHandler.trigger(new ToggleSaveRevisionStateActionEvent({ saving: false }));
        triggerOnFinish(args, pageFromApi);
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
