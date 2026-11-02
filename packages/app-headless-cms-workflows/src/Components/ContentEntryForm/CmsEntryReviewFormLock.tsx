import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { ContentEntryForm } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { useCmsEntryReview } from "~/features/editorReview/useCmsEntryReview.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

interface FormLockProps {
    isLocked: boolean;
    children: React.ReactNode;
}

/*
 * One stable wrapper, always rendered, so toggling the lock never remounts the form. A disabled
 * fieldset stops native inputs; `inert` stops everything else (rich text editors, custom field
 * renderers). Trade-off: `inert` also blocks text selection and copy inside the form while it is
 * locked; nothing else can stop contenteditable editors from being edited, and the server stays
 * authoritative (`TargetLocked`).
 */
const FormLock = ({ isLocked, children }: FormLockProps) => {
    const wrapper = useRef<HTMLFieldSetElement>(null);

    useEffect(() => {
        if (wrapper.current) {
            wrapper.current.inert = isLocked;
        }
    }, [isLocked]);

    return (
        <fieldset ref={wrapper} disabled={isLocked} className={"m-0 min-w-0 p-0"}>
            {children}
        </fieldset>
    );
};

export const CmsEntryReviewFormLock = ContentEntryForm.createDecorator(Original => {
    return createReactiveComponent(function CmsEntryReviewFormLockDecorator() {
        const formPresenter = useContentEntryFormPresenter();
        const session = useCmsEntryReview();
        const { entry, model } = formPresenter.vm;
        const isReviewed = entry !== null && isReviewableModel(model);
        const isLocked = isReviewed && !session.presenter.vm.allowsEditing;

        return (
            <FormLock isLocked={isLocked}>
                <Original />
            </FormLock>
        );
    });
});
