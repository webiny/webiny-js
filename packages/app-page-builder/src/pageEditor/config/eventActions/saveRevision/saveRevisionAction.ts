import gql from "graphql-tag";
import lodashIsEqual from "lodash/isEqual";
import lodashDebounce from "lodash/debounce";
import { SaveRevisionActionArgsType } from "./types";
import { ToggleSaveRevisionStateActionEvent } from "./event";
import { PageAtomType } from "~/pageEditor/state";
import { PageEventActionCallable } from "~/pageEditor/types";

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

    const data: PageRevisionType = {
        title: state.page.title,
        snippet: state.page.snippet,
        path: state.page.path,
        settings: state.page.settings,
        content: await state.getElementTree(),
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
