import { SaveRevisionActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/saveRevision/types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PageAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import { setIsNotSavingMutation } from "@webiny/app-page-builder/editor/recoil/modules/ui/mutations/setIsNotSavingMutation";
import gql from "graphql-tag";
import lodashIsEqual from "lodash/isEqual";

type PageRevisionType = Pick<PageAtomType, "title" | "snippet" | "url" | "settings" | "content"> & {
    category: string;
};

let lastSavedRevisionData: any = {};

const isDataEqualToLastSavedData = (data: PageRevisionType) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, ...restOfData } = data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content: lastContent, ...restOfLastRevisionData } = lastSavedRevisionData;
    return lodashIsEqual(restOfData, restOfLastRevisionData);
};

const triggerOnFinish = (args: SaveRevisionActionArgsType): void => {
    if (!args.onFinish || typeof args.onFinish !== "function") {
        return;
    }
    args.onFinish();
};

export const saveRevisionAction: EventActionCallableType<SaveRevisionActionArgsType> = async (
    state,
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
        content: state.page.content,
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

    await args.client.mutate({
        mutation: updateRevision,
        variables: {
            id: state.page.id,
            data
        }
    });
    triggerOnFinish(args);

    return {
        state: {
            ui: setIsNotSavingMutation(state.ui)
        }
    };
};
