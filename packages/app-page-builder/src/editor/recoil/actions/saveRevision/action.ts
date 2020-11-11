import { SaveRevisionActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/saveRevision/types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PageAtomType, uiAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { updateConnectedValue } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { setIsNotSavingMutation } from "@webiny/app-page-builder/editor/recoil/modules/ui/mutations/setIsNotSavingMutation";
import { setIsSavingMutation } from "@webiny/app-page-builder/editor/recoil/modules/ui/mutations/setIsSavingMutation";
import { PbElement } from "@webiny/app-page-builder/types";
import gql from "graphql-tag";
import lodashIsEqual from "lodash/isEqual";
import lodashDebounce from "lodash/debounce";

type PageRevisionType = Pick<PageAtomType, "title" | "snippet" | "url" | "settings"> & {
    category: string;
    content: PbElement;
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

export const saveRevisionAction: EventActionCallableType<SaveRevisionActionArgsType> = async (
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
        url: state.page.url,
        settings: state.page.settings,
        content: state.content,
        category: state.page.category.id
    };
    if (isDataEqualToLastSavedData(data)) {
        triggerOnFinish(args);
        return {};
    }

    lastSavedRevisionData = data;

    const updateRevision = gql`
        mutation UpdateRevision($id: ID!, $data: PbUpdatePageInput!) {
            pageBuilder {
                updateRevision(id: $id, data: $data) {
                    data {
                        id
                        content
                        title
                        published
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
            updateConnectedValue(uiAtom, prev => {
                return setIsSavingMutation(prev);
            });
            await meta.client.mutate({
                mutation: updateRevision,
                variables: {
                    id: state.page.id,
                    data
                }
            });
            updateConnectedValue(uiAtom, prev => {
                return setIsNotSavingMutation(prev);
            });
            triggerOnFinish(args);
        })();
    }, 2000);
    debouncedSave();

    return {};
};
