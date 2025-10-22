export interface IPathModelDto {
    value: string;
}

export interface IPathModel {
    toString(): string;
    toDto(): IPathModelDto;
    join: (...paths: string[]) => IPathModel;
    existsSync: () => boolean;
}
