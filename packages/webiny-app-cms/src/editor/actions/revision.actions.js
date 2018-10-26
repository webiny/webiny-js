import gql from "graphql-tag";
import { isEqual, pick } from "lodash";
import { createAction, addMiddleware, addReducer } from "webiny-app-cms/editor/redux";
import { getPage } from "webiny-app-cms/editor/selectors";
import { PREFIX, UPDATE_ELEMENT, DELETE_ELEMENT } from "./actions";

export const SAVING_REVISION = `${PREFIX} Save revision`;
export const START_SAVING = `${PREFIX} Started saving`;
export const FINISH_SAVING = `${PREFIX} Finished saving`;

let lastSavedRevision = null;
const dataChanged = revision => {
    if (!lastSavedRevision) {
        return true;
    }

    const { content, ...other } = revision;
    const { content: lastContent, ...lastOther } = lastSavedRevision;

    return !isEqual(content, lastContent) || !isEqual(other, lastOther);
};

export const saveRevision = createAction(SAVING_REVISION);
addMiddleware(
    [UPDATE_ELEMENT, DELETE_ELEMENT, "@@redux-undo/UNDO", "@@redux-undo/REDO"],
    ({ store, next, action }) => {
        next(action);

        if (action.type === UPDATE_ELEMENT && action.payload.history === false) {
            return;
        }

        store.dispatch(saveRevision());
    }
);

const startSaving = { type: START_SAVING, payload: { progress: true } };
const finishSaving = { type: FINISH_SAVING, payload: { progress: false } };

addReducer([START_SAVING, FINISH_SAVING], "ui.saving", (state = false, action) => {
    return action.payload.progress;
});

addMiddleware([SAVING_REVISION], ({ store, next, action }) => {
    next(action);

    // Construct page payload
    const data = getPage(store.getState());
    const revision = pick(data, ["title", "slug", "settings"]);
    revision.content = data.content.present;

    // Check if API call is necessary
    if (!dataChanged(revision)) {
        return;
    }

    lastSavedRevision = revision;

    const updateRevision = gql`
        mutation UpdateRevision($id: ID!, $data: UpdatePageInput!) {
            cms {
                updateRevision(id: $id, data: $data) {
                    data {
                        id
                    }
                    error {
                        code
                        message
                    }
                }
            }
        }
    `;

    store.dispatch(startSaving);

    action.meta.client
        .mutate({ mutation: updateRevision, variables: { id: data.id, data: revision } })
        .then(data => {
            store.dispatch(finishSaving);
            return data;
        })
        .catch(err => {
            store.dispatch(finishSaving);
            console.log(err);
        });
});
