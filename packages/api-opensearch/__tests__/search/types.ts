interface Person {
    name: string;
    age: number;
    dateOfBirth: string;
}

export interface Child extends Person {
    gamer: boolean;
}
export interface Adult extends Person {
    married?: boolean;
    children?: Child[];
    /**
     * should be really long string.
     */
    biography?: string | null;
}
