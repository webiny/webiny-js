import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useSyncExternalStore
} from "react";

export interface PreviewComponent {
    name: string;
    label: string;
    description: string;
}

type Listener = () => void;

class PreviewComponentsStore {
    private components: PreviewComponent[] = [];
    private listeners = new Set<Listener>();

    getComponents(): PreviewComponent[] {
        return this.components;
    }

    addComponent(component: PreviewComponent): void {
        const exists = this.components.some(c => c.name === component.name);
        if (exists) {
            this.components = this.components.map(c => (c.name === component.name ? component : c));
        } else {
            this.components = [...this.components, component];
        }
        console.log(
            "[PreviewComponentsStore] addComponent:",
            component.name,
            "total:",
            this.components.length
        );
        this.notify();
    }

    clear(): void {
        this.components = [];
        this.notify();
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        this.listeners.forEach(fn => fn());
    }
}

const store = new PreviewComponentsStore();

export const usePreviewComponents = () => {
    const components = useSyncExternalStore(
        cb => store.subscribe(cb),
        () => store.getComponents(),
        () => [] as PreviewComponent[]
    );

    return {
        components,
        addComponent: (component: PreviewComponent) => store.addComponent(component)
    };
};

interface PreviewComponentsProviderProps {
    children: React.ReactNode;
}

export const PreviewComponentsProvider = ({ children }: PreviewComponentsProviderProps) => {
    return <>{children}</>;
};
