export type Plugin = {
    name: string;
    type: string;
    init?: () => void;
}
