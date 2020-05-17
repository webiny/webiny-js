import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import { List } from "@webiny/ui/List";
import { Elevation } from "@webiny/ui/Elevation";
import Revision from "./Revision";
import get from "lodash/get";
import { CircularProgress } from "@webiny/ui/Progress";
import { useMutation, useQuery } from "@webiny/app-headless-cms/admin/hooks";
import {
    createCreateFromMutation,
    createDeleteMutation,
    createPublishMutation,
    createListRevisionsQuery
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

    const { CREATE_CONTENT_FROM, DELETE_CONTENT, PUBLISH_CONTENT, LIST_REVISIONS } = useMemo(() => {
        return {
            CREATE_CONTENT_FROM: createCreateFromMutation(contentModel),
            DELETE_CONTENT: createDeleteMutation(contentModel),
            PUBLISH_CONTENT: createPublishMutation(contentModel),
            LIST_REVISIONS: createListRevisionsQuery(contentModel)
        };
    }, [contentModel.modelId]);

    console.log(content);
    const { data: revisionsList, refetch } = useQuery(LIST_REVISIONS, {
        variables: { id: get(content, "meta.parent") }
    });

    const revisions = get(revisionsList, "content.data.meta.revisions", []);

    const [createFromMutation] = useMutation(CREATE_CONTENT_FROM);
    const [deleteMutation] = useMutation(DELETE_CONTENT);
    const [publishMutation] = useMutation(PUBLISH_CONTENT);

    const createContentFrom = useCallback(async revision => {
        setLoading(true);
        const response = await createFromMutation({
            variables: { revision: revision.id }
        });

        if (response.data.content.error) {
            setLoading(false);
            showSnackbar(response.data.content.error.message);
            return;
        }

        await Promise.all([dataList.refresh(), refetch()]);
        setLoading(false);

        showSnackbar(t`New content entry revision created.`);
        const { id } = response.data.content.data;
        const query = new URLSearchParams(location.search);
        query.set("id", id);
        history.push({ search: query.toString() });
    }, []);

    const deleteContent = useCallback(async revision => {
        setLoading(true);
        const response = await deleteMutation({
            variables: { revision: revision.id }
        });

        if (response.data.content.error) {
            setLoading(false);
            showSnackbar(response.data.content.error.message);
            return;
        }

        if (revision.id === revision.meta.parent) {
            await dataList.refresh();
            setLoading(false);
            history.push(`/cms/content-models/manage/${contentModel.modelId}`);
            showSnackbar(t`Content entry and all of its revisions deleted.`);
            return;
        }

        await Promise.all([dataList.refresh(), refetch()]);
        setLoading(false);

        if (revision.id === content.id) {
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
        if (content.error) {
            setLoading(false);
            showSnackbar(content.error.message);
            return;
        }

        await dataList.refresh();
        setLoading(false);

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
