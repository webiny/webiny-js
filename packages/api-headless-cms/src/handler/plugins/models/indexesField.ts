import {
    withFields,
    withProps,
    string,
    fields,
    onSet,
    date,
    skipOnPopulate,
    setOnce,
    pipe
} from "@webiny/commodo";
import isEqual from "fast-deep-equal";
const getRawData = fields => {
    return fields.map(item => {
        return { fields: item.fields };
    });
};
export const indexes = () => {
    const indexesField = onSet(value => {
        if (!Array.isArray(value)) {
            return [{ fields: ["id"] }];
        }

        const modelIndexes = value.map(index => ({ fields: index.fields.sort() }));
        if (!modelIndexes.find(i => i.fields.join(",") === "id")) {
            modelIndexes.push({ fields: ["id"] });
        }
        return modelIndexes;
    })(
        fields({
            list: true,
            instanceOf: withFields({
                fields: string({ list: true }),
                createdOn: pipe(
                    skipOnPopulate(),
                    setOnce()
                )(date({ value: new Date() }))
            })(),
            value: { value: [{ fields: ["id"] }] }
        })
    );
    return withProps(instance => {
        return {
            isDirty() {
                return this.state.dirty;
            },
            isDifferentFrom(newValue) {
                if (newValue === null || instance.current === null) {
                    return true;
                }
                return !isEqual(getRawData(instance.current), getRawData(newValue));
            }
        };
    })(indexesField);
};
