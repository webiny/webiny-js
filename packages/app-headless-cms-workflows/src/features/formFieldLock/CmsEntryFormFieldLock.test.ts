import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import type { IField } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { ContentEntryFormModelModifier } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { CmsEntryFormFieldLock } from "./abstractions.js";
import { CmsEntryFormFieldLockFeature } from "./feature.js";

interface FakeField {
    disabled: boolean;
    setDisabled(value: boolean): void;
}

function createField(disabled = false): FakeField {
    return {
        disabled,
        setDisabled(value: boolean) {
            this.disabled = value;
        }
    };
}

function createForm(fields: Record<string, FakeField>): IFormModel {
    return {
        field(name: string): IField {
            const field = fields[name];
            if (!field) {
                throw new Error(`No field "${name}".`);
            }
            return field as unknown as IField;
        }
    } as unknown as IFormModel;
}

function createModel(fieldIds: string[]): CmsModel {
    return {
        modelId: "article",
        fields: fieldIds.map(fieldId => ({ fieldId }))
    } as unknown as CmsModel;
}

describe("CmsEntryFormFieldLock", () => {
    let container: Container;
    let fieldLock: CmsEntryFormFieldLock.Interface;

    beforeEach(() => {
        container = new Container();
        CmsEntryFormFieldLockFeature.register(container);
        fieldLock = container.resolve(CmsEntryFormFieldLock);
    });

    it("hands every form the editor builds to the lock, as a form model modifier", () => {
        const title = createField();
        const modifiers = container.resolveAll(ContentEntryFormModelModifier);
        fieldLock.setLocked(true);

        for (const modifier of modifiers) {
            modifier.modifyForm(createForm({ title }), createModel(["title"]));
        }

        expect(modifiers).toHaveLength(1);
        expect(title.disabled).toBe(true);
    });

    it("disables the top-level fields when locked and enables them again when unlocked", () => {
        const title = createField();
        const author = createField();
        fieldLock.track(createForm({ title, author }), createModel(["title", "author"]));

        fieldLock.setLocked(true);

        expect(title.disabled).toBe(true);
        expect(author.disabled).toBe(true);

        fieldLock.setLocked(false);

        expect(title.disabled).toBe(false);
        expect(author.disabled).toBe(false);
    });

    it("locks a form built while the lock is on", () => {
        const title = createField();
        fieldLock.setLocked(true);

        fieldLock.track(createForm({ title }), createModel(["title"]));

        expect(title.disabled).toBe(true);
    });

    it("leaves a field disabled for another reason disabled after unlocking", () => {
        const title = createField();
        const slug = createField(true);
        fieldLock.track(createForm({ title, slug }), createModel(["title", "slug"]));

        fieldLock.setLocked(true);
        fieldLock.setLocked(false);

        expect(title.disabled).toBe(false);
        expect(slug.disabled).toBe(true);
    });

    it("skips a model field the form does not have", () => {
        const title = createField();
        fieldLock.track(createForm({ title }), createModel(["title", "hidden"]));

        fieldLock.setLocked(true);

        expect(title.disabled).toBe(true);
        expect(fieldLock.isLocked).toBe(true);
    });
});
