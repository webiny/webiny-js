// The empty state of the list (R322): the design icon, the title, the text and whether `Add exclusion` shows.
export interface ExclusionsEmptyVm {
    icon: "person_off" | "history";
    title: string;
    text: string;
    showAdd: boolean;
}
