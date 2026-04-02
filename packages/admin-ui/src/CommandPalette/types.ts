import type React from "react";

export interface CommandPaletteCommand {
    name: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    category?: string;
    keywords?: string[];
    shortcut?: string;
    hasDetailView: boolean;
}

export interface CommandPaletteDetailView {
    label: string;
    icon?: React.ReactNode;
    element: React.ReactNode;
}

export interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commands: CommandPaletteCommand[];
    detailView?: CommandPaletteDetailView;
    onSelectCommand: (name: string) => void;
    onCancelCommand: () => void;
    placeholder?: string;
}
