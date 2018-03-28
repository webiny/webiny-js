// TODO: REMOVE THIS FILE
/*

import ApiContainer from './apiContainer';

export default (Base) => {
    const apiContainers = {};

    return class extends Base {
        constructor(...params) {
            super(...params);

            this.apiMethods = [];
            this.discoverable = true;
            this.classId = null;
        }

        static getClassId() {
            return this.classId;
        }

        initializeApi(api) {
            throw Error("Override to implement");
        }

        isDiscoverable() {
            return this.discoverable;
        }

        apiFormatList(collection, fields = '*') {
            return collection;

            // TODO
            const perPage = collection.getLimit();
            const offset = collection.getOffset();
            const page = offset > 0 ? (offset / perPage) + 1 : 1;

            return {
                'meta': {
                    'totalCount': collection.totalCount(),
                    'totalPages': perPage > 0 ? Math.ceil(collection.totalCount() / perPage) : 1,
                    'perPage': perPage,
                    'currentPage': page,
                    'fields': fields
                },
                'list': collection.toArray(fields)
            }
        }

        getApi() {
            const className = this.constructor.name;
            let apiContainer = apiContainers[className] || null;
            if (!apiContainer) {
                apiContainer = new ApiContainer(this);
                apiContainers[className] = apiContainer;
                this.initializeApi(apiContainer);
            }

            return apiContainer;
        }
    }
};*/
