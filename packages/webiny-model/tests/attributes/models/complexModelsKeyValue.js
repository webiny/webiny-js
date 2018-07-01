import { Model } from "webiny-model";

const mock = {
    entities: {
        SecurityUser: {
            group: {
                methods: null,
                __typename: "entityAccessClassType",
                attributes: null,
                operations: {
                    read: true,
                    create: null,
                    delete: null,
                    update: null,
                    __typename: "entityAccessClassOperationsType"
                }
            },
            other: {
                methods: null,
                __typename: "entityAccessClassType",
                attributes: null,
                operations: {
                    read: null,
                    create: true,
                    delete: null,
                    update: null,
                    __typename: "entityAccessClassOperationsType"
                }
            },
            owner: {
                methods: null,
                __typename: "entityAccessClassType",
                attributes: null,
                operations: {
                    read: true,
                    create: null,
                    delete: null,
                    update: true,
                    __typename: "entityAccessClassOperationsType"
                }
            },
            roles: { "5af06f2946e6da754304ea7a": { operations: { read: true } } }
        }
    }
};

class OperationsModel extends Model {
    constructor() {
        super();
        this.attr("create").boolean();
        this.attr("read").boolean();
        this.attr("update").boolean();
        this.attr("delete").boolean();
    }
}

class ClassModel extends Model {
    constructor() {
        super();
        this.attr("operations").model(OperationsModel);
        this.attr("methods").object();
        this.attr("fields").object();
    }
}

class EntityModel extends Model {
    constructor() {
        super();
        this.attr("group").model(ClassModel);
        this.attr("owner").model(ClassModel);
        this.attr("other").model(ClassModel);
        this.attr("roles").models(ClassModel, true);
    }
}

class DataModel extends Model {
    constructor() {
        super();
        this.attr("entities").models(EntityModel, true);
    }
}

class SettingsModel extends Model {
    constructor() {
        super();
        this.attr("data").model(DataModel);
    }
}

export default { OperationsModel, ClassModel, EntityModel, DataModel, SettingsModel, mock };
