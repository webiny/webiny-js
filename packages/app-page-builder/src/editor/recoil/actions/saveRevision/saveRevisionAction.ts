import { SaveRevisionActionArgsType } from "./types";
import { ToggleSaveRevisionStateActionEvent } from "./event";
import { EventActionCallable } from "@webiny/app-page-builder/types";
import { PageAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import gql from "graphql-tag";
import lodashIsEqual from "lodash/isEqual";
import lodashDebounce from "lodash/debounce";

type PageRevisionType = Pick<PageAtomType, "title" | "snippet" | "path" | "settings"> & {
    category: string;
    content: any;
};

let lastSavedRevisionData: any = {};

const isDataEqualToLastSavedData = (data: PageRevisionType) => {
    return lodashIsEqual(data, lastSavedRevisionData);
};

const triggerOnFinish = (args?: SaveRevisionActionArgsType): void => {
    if (!args || !args.onFinish || typeof args.onFinish !== "function") {
        return;
    }
    args.onFinish();
};

let debouncedSave = null;

export const saveRevisionAction: EventActionCallable<SaveRevisionActionArgsType> = async (
    state,
    meta,
    args
) => {
    if (state.page.locked) {
        return {};
    }

    const data: PageRevisionType = {
        title: state.page.title,
        snippet: state.page.snippet,
        path: state.page.path,
        settings: state.page.settings,
        content: await state.getElementTree(),
        category: state.page.category.slug
    };

    if (isDataEqualToLastSavedData(data)) {
        triggerOnFinish(args);
        return {};
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
                        dynamic
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

    debouncedSave = lodashDebounce(() => {
        (async () => {
            meta.eventActionHandler.trigger(
                new ToggleSaveRevisionStateActionEvent({ saving: true })
            );

            await meta.client.mutate({
                mutation: updatePage,
                variables: {
                    id: state.page.id,
                    data
                }
            });

            meta.eventActionHandler.trigger(
                new ToggleSaveRevisionStateActionEvent({ saving: false })
            );
            triggerOnFinish(args);
        })();
    }, 2000);
    debouncedSave();

    return {};
};
