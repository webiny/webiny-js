import { makeAutoObservable } from "mobx";
import { runInAction } from "mobx";
import { GetSettingsUseCase } from "~/admin/features/settings/getSettings/index.js";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";
import type { IAiPowerUpsPersonaPreset } from "~/admin/features/settings/shared/abstractions.js";
import { PromptContextPresenter as Abstraction } from "./abstractions.js";

const toOption = (preset: { id: string; name: string; description?: string }) => {
    const option: Abstraction.Option = { id: preset.id, name: preset.name };
    if (preset.description) {
        option.description = preset.description;
    }
    return option;
};

const personaOptions = (presets: IAiPowerUpsPersonaPreset[] | undefined) => {
    return (presets ?? []).map(toOption);
};

/*
 * A singleton, so the choice outlives one editor: going from one page to the next keeps the voice
 * the user picked. It is not saved, so a reload starts with none.
 */
class PromptContextPresenterImpl implements Abstraction.Interface {
    private settings: IAiPowerUpsSettings | null = null;
    private projectId: string | null = null;
    private readerPersonaId: string | null = null;
    private writerPersonaId: string | null = null;
    private files: Abstraction.File[] = [];

    constructor(private getSettings: GetSettingsUseCase.Interface) {
        makeAutoObservable<PromptContextPresenterImpl, "getSettings">(
            this,
            { getSettings: false },
            { autoBind: true }
        );
    }

    get vm(): Abstraction.ViewModel {
        const projects = (this.settings?.projects?.presets ?? []).map(toOption);
        const readerPersonas = personaOptions(this.settings?.readerPersonas?.presets);
        const writerPersonas = personaOptions(this.settings?.writerPersonas?.presets);

        return {
            projects,
            readerPersonas,
            writerPersonas,
            project: projects.find(option => option.id === this.projectId) ?? null,
            readerPersona:
                readerPersonas.find(option => option.id === this.readerPersonaId) ?? null,
            writerPersona:
                writerPersonas.find(option => option.id === this.writerPersonaId) ?? null,
            files: this.files
        };
    }

    async load(): Promise<void> {
        const settings = await this.getSettings.execute();
        runInAction(() => {
            this.settings = settings;
        });
    }

    setProject(id: string | null): void {
        this.projectId = id;
        const project = this.settings?.projects?.presets?.find(preset => preset.id === id);
        if (project?.defaultReaderPersonaId) {
            this.readerPersonaId = project.defaultReaderPersonaId;
        }
        if (project?.defaultWriterPersonaId) {
            this.writerPersonaId = project.defaultWriterPersonaId;
        }
    }

    setReaderPersona(id: string | null): void {
        this.readerPersonaId = id;
    }

    setWriterPersona(id: string | null): void {
        this.writerPersonaId = id;
    }

    attachFiles(files: Abstraction.File[]): void {
        const attached = new Set(this.files.map(file => file.id));
        const added = files.filter(file => !attached.has(file.id));
        this.files = [...this.files, ...added];
    }

    removeFile(id: string): void {
        this.files = this.files.filter(file => file.id !== id);
    }

    /*
     * Only choices that are still presets: one deleted in the settings since it was picked is not
     * sent, so the request never names a project the server can't find.
     */
    value(): Record<string, unknown> | undefined {
        const { project, readerPersona, writerPersona } = this.vm;
        const value: Record<string, unknown> = {};
        if (project) {
            value["projectId"] = project.id;
        }
        if (readerPersona) {
            value["readerPersonaId"] = readerPersona.id;
        }
        if (writerPersona) {
            value["writerPersonaId"] = writerPersona.id;
        }
        if (this.files.length > 0) {
            value["additionalFileIds"] = this.files.map(file => file.id);
        }
        return Object.keys(value).length > 0 ? value : undefined;
    }
}

export const PromptContextPresenterImplementation = Abstraction.createImplementation({
    implementation: PromptContextPresenterImpl,
    dependencies: [GetSettingsUseCase]
});
