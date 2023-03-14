// This approach will cause attribute to be defined from scratch for every single class instance!!!
//
// class BaseModel {
//     protected defineAttributes() {
//         this.addAttribute({
//             name: "name",
//             defaultValue: "Default name",
//             onSet: value => value.toLowerCase(),
//             validation: () => z.number()
//         })
//     }
// }
