import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import { List } from "@webiny/ui/List";
import { Elevation } from "@webiny/ui/Elevation";
import Revision from "./Revision";
import get from "lodash/get";
import { CircularProgress } from "@webiny/ui/Progress";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import {
    createCreateFromMutation,
    createDeleteMutation,
    createPublishMutation
} from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import useReactRouter from "use-react-router";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

const style = {
    list: css({
        position: "relative",
        margin: 25,
        display: "flex",
        flexDirection: "column",
        overflow: "scroll",
        maxHeight: "calc(100vh - 160px)",
        ".mdc-list .mdc-list-item": {
            borderBottom: "1px solid var(--mdc-theme-on-background)"
        },
        ".mdc-list .mdc-list-item:last-child": {
            borderBottom: "none"
        }
    }),
    nothingToShow: css({
        padding: 20,
        margin: 25,
        textAlign: "center"
    })
};

const RevisionsList = props => {
    const { showSnackbar } = useSnackbar();
    const { content, contentModel, setLoading, dataList } = props;
    const { history } = useReactRouter();

    const revisions = get(content, "meta.revisions", []);

    const { CREATE_CONTENT_FROM, DELETE_CONTENT, PUBLISH_CONTENT } = useMemo(() => {
        return {
            CREATE_CONTENT_FROM: createCreateFromMutation(contentModel),
            DELETE_CONTENT: createDeleteMutation(contentModel),
            PUBLISH_CONTENT: createPublishMutation(contentModel)
        };
    }, [contentModel.modelId]);

    const [createFromMutation] = useMutation(CREATE_CONTENT_FROM);
    const [deleteMutation] = useMutation(DELETE_CONTENT);
    const [publishMutation] = useMutation(PUBLISH_CONTENT);

    const createContentFrom = useCallback(async revision => {
        setLoading(true);
        const response = await createFromMutation({
            variables: { revision: revision.id }
        });
        setLoading(false);

        if (response.data.content.error) {
            showSnackbar(response.data.content.error.message);
            return;
        }

        showSnackbar(t`New content entry revision created.`);
        const { id } = response.data.content.data;
        const query = new URLSearchParams(location.search);
        query.set("id", id);
        history.push({ search: query.toString() });
        dataList.refresh();
    }, []);

    const deleteContent = useCallback(async revision => {
        setLoading(true);
        const response = await deleteMutation({
            variables: { revision: revision.id }
        });
        setLoading(false);

        if (response.data.content.error) {
            showSnackbar(response.data.content.error.message);
            return;
        }

        dataList.refresh();

        if (revision.id === revision.meta.parent) {
            history.push(`/cms/content-models/manage/${contentModel.modelId}`);
            showSnackbar(t`Content entry and all of its revisions deleted.`);
        } else if (revision.id === content.id) {
            let revisionId;
            for (let i = 0; i < content.revisions.length; i++) {
                const current = content.revisions[i];
                if (current.id !== content.id) {
                    revisionId = current.id;
                    break;
                }
            }

            if (revisionId) {
                const query = new URLSearchParams(location.search);
                query.set("id", revisionId);
                history.push({ search: query.toString() });
            }
        }
        showSnackbar(t`Content entry revision deleted.`);
    }, []);

    const publishContent = useCallback(async revision => {
        setLoading(true);
        const response = await publishMutation({
            variables: { revision: revision.id }
        });

        const content = get(response, "data.content");
        setLoading(false);
        if (content.error) {
            return showSnackbar(content.error.message);
        }

        dataList.refresh();

        showSnackbar(
            <span>
                {t`Successfully published revision {revision}.`({
                    revision: <strong>#{revision.meta.version}</strong>
                })}
            </span>
        );
    }, []);

    return (
        <Elevation className={style.list} z={2}>
            {props.getLoading() && <CircularProgress />}
            {revisions.length ? (
                <List nonInteractive twoLine>
                    {revisions.map(revisions => (
                        <Revision
                            {...props}
                            revision={revisions}
                            key={revisions.id}
                            createContentFrom={createContentFrom}
                            deleteContent={deleteContent}
                            publishContent={publishContent}
                        />
                    ))}
                </List>
            ) : (
                <div className={style.nothingToShow}>{t`No revisions to show.`}</div>
            )}
        </Elevation>
    );
};

export default RevisionsList;
