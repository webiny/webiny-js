import mdbid from "mdbid";
const mocks = {
    job: index => {
        return {
            id: mdbid(),
            args: {
                render: {
                    configuration: {
                        db: {
                            namespace: "T#root"
                        }
                    },
                    tag: {
                        value: `main-menu-${index}`,
                        key: "pb-menu"
                    }
                }
            }
        };
    }
};

export default mocks;
