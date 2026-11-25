// The empty state of the list (R322): the title, the text (none for a search without a match) and which button shows.
export interface ExclusionsEmptyVm {
    title: string;
    text: string | null;
    showAdd: boolean;
    // `Clear search`: only for a search that matches no one.
    showClearSearch: boolean;
}
