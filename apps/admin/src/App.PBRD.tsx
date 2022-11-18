// import React from "react";
// import { Admin } from "@webiny/app-serverless-cms";
// import { Cognito } from "@webiny/app-admin-users-cognito";
// import "./App.scss";
// import { PageElementsProvider } from "./components/PageElementsProvider";
//
// const SpaceX = element => {
//     console.log('asd')
//     const {x} = usePageElements();
//     return <div>spacex</div>;
// }
//
// // probat cu samo
// const a = <SpaceX/>;
//
// export const App: React.FC = () => {
//     return (
//         <Admin>
//             <Cognito />
//             <AddPageElementRenderer
//                 type={"spacex"}
//                 // Ovo je React komponenta ili f-ja koja vrace element?
//                 component={SpaceX}
//             />
//             <AddGraphQLQuerySelection />
//         </Admin>
//     );
// };
//
//
// import React from "react";
// import { Cognito } from "@webiny/app-admin-users-cognito";
// import {
//     Admin,
//     // Added these to `@webiny/app-serverless-cms` exports.
//     AddPageElementRenderer,
//     AddPageElementStylesModifier,
//     ElementStylesModifier,
//     usePageElements
// } from "@webiny/app-serverless-cms";
//
// import "./App.scss";
//
// // A custom element renderer.
// // Of course, doesn't have to be defined here inline.
// const MyCustomElementRenderer = element => {
//     const { getElementClassNames } = usePageElements();
//     return <div className={getElementClassNames(element)}>{element.something}</div>;
// };
//
// // This is a copy of the height styles modifier (the simplest styles modifier there is at the moment).
// // Of course, doesn't have to be defined here inline.
// const myCustomElementStylesModifier: ElementStylesModifier = ({ element, theme }) => {
//     const { height } = element.data.settings || {};
//     if (!height) {
//         return {};
//     }
//
//     return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
//         if (!height[breakpointName]) {
//             return returnStyles;
//         }
//         return { ...returnStyles, [breakpointName]: { height: height[breakpointName].value } };
//     }, {});
// };
//
//
// export const App: React.FC = () => {
//     return (
//         <Admin>
//             <Cognito />
//             <AddPageElementRenderer type={"myCustomElementRenderer"} component={MyCustomElementRenderer} />
//             <AddPageElementStylesModifier type={"myCustomElementStylesModifier"} modifier={myCustomElementStylesModifier} />
//         </Admin>
//     );
// };
