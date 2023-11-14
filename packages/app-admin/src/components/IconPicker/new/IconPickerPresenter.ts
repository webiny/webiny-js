import { IconDTO, IconRepository } from "~/components/IconPicker/new/domain";

export interface IconPickerPresenterInterface {
    load(icon: IconDTO): Promise<void>;
    open(): void;
    close(): void;
    setIcon(icon: IconDTO): void;
    filterIcons(value: string): void;
    get vm(): {
        isOpen: boolean;
        icons: IconDTO[];
        selectedIcon: IconDTO | null;
        filter: string | null;
    };
}

export class IconPickerPresenter implements IconPickerPresenterInterface {
    private repository: IconRepository;
    private isOpen = false;
    private selectedIcon: IconDTO | null = null;
    private filter: string | null = null;

    constructor(repository: IconRepository) {
        this.repository = repository;
    }

    async load(value: IconDTO) {
        this.selectedIcon = value;
        await this.repository.initialize();
    }

    get vm() {
        return {
            isOpen: this.isOpen,
            icons: this.repository.getIcons(),
            selectedIcon: this.selectedIcon,
            filter: this.filter
        };
    }

    open() {
        this.isOpen = true;
    }

    close() {
        this.isOpen = false;
    }

    setIcon(icon: IconDTO) {
        this.selectedIcon = icon;
    }

    filterIcons(value: string) {
        this.filter = value;
    }
}
