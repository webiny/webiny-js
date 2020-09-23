import { string, int, fields, withFields, boolean, float } from "@webiny/commodo";

const PbImageFieldMetaModel = withFields({
    width: int(),
    height: int(),
    aspectRatio: float(),
    private: boolean()
});

const PbImageFieldModel: () => any = withFields({
    id: string(),
    name: string(),
    size: int(),
    type: string(),
    meta: fields({
        value: null,
        instanceOf: PbImageFieldMetaModel()
    })
});

export default PbImageFieldModel;
