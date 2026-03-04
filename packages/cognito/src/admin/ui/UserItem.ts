export interface IUserTeam {
    id: string;
}

export interface IUserGroup {
    id: string;
}

export interface UserItem {
    id: string;
    avatar: {
        src: string;
    };
    firstName: string;
    lastName: string;
    email: string;
    external?: boolean;
    team: IUserTeam;
    group: IUserGroup;
}
