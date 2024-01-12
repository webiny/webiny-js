import { makeAutoObservable } from "mobx";
import { FileItem } from "@webiny/app-admin/types";

export class EditFileUsingUrlRepository {
    private cache: Map<string, FileItem> = new Map();

    constructor() {
        makeAutoObservable(this);
    }

    async getFileByUrl(url: string) {
        if (this.cache.has(url)) {
            return this.cache.get(url) as FileItem;
        }

        const file = await new Promise<FileItem>(resolve => {
            setTimeout(() => {
                resolve({
                    id: "6594165f40bc350008c74725",
                    createdOn: "2023-09-25T16:31:18.415Z",
                    savedOn: "2023-09-25T16:31:18.415Z",
                    createdBy: {
                        id: "6496fbd7d6062300081e4727",
                        displayName: "Pavel Denisjuk"
                    },
                    src: "https://d26watk6chcr2b.cloudfront.net/files/6594165f40bc350008c74725/image-32.jpg",
                    location: {
                        folderId: "root"
                    },
                    name: "icon 7.svg",
                    key: "6594165f40bc350008c74725/image-32.jpg",
                    type: "image/jpeg",
                    size: 11026,
                    meta: {
                        private: false
                    },
                    tags: [],
                    aliases: [],
                    accessControl: {
                        type: "public"
                    },
                    extensions: {}
                });
            }, 1000);
        });

        this.cache.set(url, file);

        return file;
    }
}
