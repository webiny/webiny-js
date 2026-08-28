import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useContainer, useRoute } from "@webiny/app";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { useCommentsPresenter } from "~/presentation/comments/useComments.js";
import { CommentsPanel } from "~/presentation/comments/components/CommentsPanel.js";
import { CommentMarkersProvider } from "~/cms/CommentMarkersContext.js";
import { collectItemLocators } from "~/cms/listItemLocators.js";
import { buildLocatorLabel } from "~/cms/fieldLabels.js";
import { cmsContentId, COLLAB_THREAD_PARAM, COLLAB_FIELD_PARAM } from "~/constants.js";

export const CommentsSidePanelDecorator = ContentEntryFormContent.createDecorator(Original => {
    return observer(function CommentsSidePanelDecoratorInner(props) {
        const formPresenter = useContentEntryFormPresenter();
        const presenter = useCommentsPresenter();
        const { route: currentRoute, replaceRouteParams } = useRoute();
        const container = useContainer();

        const vm = formPresenter.vm;
        const entryId = vm.entry?.entryId;
        const modelId = vm.model?.modelId;
        const contentId =
            !vm.isNewEntry && entryId && modelId ? cmsContentId(modelId, entryId) : null;

        // Scope the per-field markers to this form's container so they don't leak into a nested
        // referenced-entry drawer (which renders in a child container). See CommentMarkersContext.
        // `itemLocators` maps every field nested inside a list item to its id-based locator (unique
        // per array element), so markers on those fields anchor to a single item. Recomputed each
        // render so it stays in sync as list items are added / removed / reordered.
        const itemLocatorMaps = collectItemLocators(vm.form);
        const markersContext = {
            contentId,
            container,
            itemLocators: itemLocatorMaps.byField
        };

        // Deep-link params (from a notification click or a copied thread link). `params` merges
        // path + query, so these arrive as query-string values on the entry URL.
        const params = currentRoute?.params as Record<string, string> | undefined;
        const threadParam = params?.[COLLAB_THREAD_PARAM];
        const fieldParam = params?.[COLLAB_FIELD_PARAM];
        const consumedRef = useRef<string | null>(null);

        useEffect(() => {
            if (vm.isNewEntry || !entryId || !modelId) {
                return;
            }
            presenter.init(cmsContentId(modelId, entryId));

            // Consume a deep-link once: open + highlight the thread, scroll the form to the field,
            // then strip the params from the URL so a refresh/back doesn't re-trigger it.
            if (threadParam && consumedRef.current !== threadParam) {
                consumedRef.current = threadParam;
                presenter.openAndHighlight(threadParam);
                if (fieldParam) {
                    formPresenter.vm.form?.focusField(fieldParam);
                }
                replaceRouteParams((current: Record<string, unknown>) => {
                    const next = { ...current };
                    delete next[COLLAB_THREAD_PARAM];
                    delete next[COLLAB_FIELD_PARAM];
                    return next;
                });
            }
        }, [
            entryId,
            modelId,
            vm.isNewEntry,
            threadParam,
            fieldParam,
            presenter,
            formPresenter,
            replaceRouteParams
        ]);

        if (vm.isNewEntry || !entryId || !modelId) {
            return <Original {...props} />;
        }

        const open = presenter.vm.isOpen;

        const modelFields = vm.model.fields || [];
        // Id-based locators (list-nested fields) carry alphanumeric `_id` segments that
        // `buildLocatorLabel` can't resolve against the model, so prefer the label precomputed
        // during the form-VM walk; non-list locators fall back to the model-driven breadcrumb.
        const resolveLabel = (locator: string) =>
            itemLocatorMaps.byLocator.get(locator) ?? buildLocatorLabel(modelFields, locator);

        const jumpToField = (locator: string) => {
            vm.form?.focusField(locator);
        };

        // The panel stays mounted so it can animate both in and out: the container width
        // transitions 0 <-> 384px (content column reflows smoothly) while the panel itself
        // slides + fades in.
        return (
            <CommentMarkersProvider value={markersContext}>
                <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
                    <div style={{ flex: "1 1 0", minWidth: 0, overflowY: "auto" }}>
                        <Original {...props} />
                    </div>
                    <div
                        style={{
                            flex: "0 0 auto",
                            width: open ? 384 : 0,
                            height: "100%",
                            overflow: "hidden",
                            transition: "width .22s ease",
                            willChange: "width"
                        }}
                    >
                        <div
                            style={{
                                width: 384,
                                height: "100%",
                                opacity: open ? 1 : 0,
                                transform: open ? "translateX(0)" : "translateX(24px)",
                                transition: "opacity .22s ease, transform .22s ease"
                            }}
                        >
                            <CommentsPanel
                                presenter={presenter}
                                onJumpToField={jumpToField}
                                resolveLabel={resolveLabel}
                            />
                        </div>
                    </div>
                </div>
            </CommentMarkersProvider>
        );
    });
});
