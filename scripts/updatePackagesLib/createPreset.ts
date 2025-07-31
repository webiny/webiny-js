export interface IPresetExcludeCb {
    (name: string): boolean;
}

export type IPresetExclude = string | string[] | RegExp | IPresetExcludeCb;

export interface IPreset {
    name: string;
    matching: RegExp;
    skipResolutions: boolean;
    caret?: boolean;
    exclude?: IPresetExclude;
}
export interface ICreatePresetCb {
    (): IPreset;
}

export const createPreset = (cb: ICreatePresetCb) => {
    return cb();
};
