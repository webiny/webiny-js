declare const _default: () => {
    showMenu: () => void;
    hideMenu: () => void;
    menuIsShown(): boolean;
    expandSection(name: string): void;
    collapseSection(name: string): void;
    toggleSection(name: string): void;
    sectionIsExpanded(name: string): any;
    initSections: () => void;
};
export default _default;
