interface BaseFileItemDto {
    id?: string;
    name?: string;
    mimeType?: string;
    size?: number;
}

interface SrcFileItemDto extends BaseFileItemDto {
    src: string;
}

interface UrlFileItemDto extends BaseFileItemDto {
    url: string;
}

export type FileItemDto = SrcFileItemDto | UrlFileItemDto;
