export interface UserItem {
    id: string;
    avatar: {
        src: string;
    };
    firstName: string;
    lastName: string;
    email: string;
    external?: boolean;
}
