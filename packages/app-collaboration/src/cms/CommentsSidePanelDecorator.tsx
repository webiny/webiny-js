import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { useCommentsPresenter } from "~/presentation/comments/useComments.js";
import { CommentsPanel } from "~/presentation/comments/components/CommentsPanel.js";
import { buildLocatorLabel } from "~/cms/fieldLabels.js";
import { cmsContentId } from "~/constants.js";

export const CommentsSidePanelDecorator = ContentEntryFormContent.createDecorator(Original => {
    return observer(function CommentsSidePanelDecoratorInner(props) {
        const formPresenter = useContentEntryFormPresenter();
        const presenter = useCommentsPresenter();

        const vm = formPresenter.vm;
        const entryId = vm.entry?.entryId;
        const modelId = vm.model?.modelId;

        useEffect(() => {
            if (!vm.isNewEntry && entryId && modelId) {
                presenter.init(cmsContentId(modelId, entryId));
            }
        }, [entryId, modelId, vm.isNewEntry, presenter]);

        if (vm.isNewEntry || !entryId || !modelId) {
            return <Original {...props} />;
        }

        const open = presenter.vm.isOpen;

        const modelFields = vm.model.fields || [];
        const resolveLabel = (locator: string) => buildLocatorLabel(modelFields, locator);

        const jumpToField = (locator: string) => {
            vm.form?.focusField(locator);
        };

        // The panel stays mounted so it can animate both in and out: the container width
        // transitions 0 <-> 384px (content column reflows smoothly) while the panel itself
        // slides + fades in.
        return (
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
        );
    });
});
