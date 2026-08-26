"use strict";(self.webpackChunk=self.webpackChunk||[]).push([["456"],{21479(e,t,l){l.r(t),l.d(t,{default:()=>p});var a=l(96540),n=l(46951),r=l(45645),m=l(35994),s=l(75382),u=l(2135);let i=`
    {
        host
        port
        user
        from
        replyTo
        source
    }
`,o=`
    {
        message
        code
        data
    }
`,c=(0,u.Ay)`
    query GetMailerSettings {
        mailer {
            settings: getSettings {
                data ${i}
                error ${o}
            }
        }
    }
`,d=(0,u.Ay)`
    mutation SaveTransportSettings($data: MailerTransportSettingsInput!) {
        mailer {
            settings: saveSettings(data: $data) {
                data ${i}
                error ${o}
            }
        }
    }
`;var E=l(76800);let p=()=>{let{showSnackbar:e}=(0,n.dhV)(),t=(0,a.useRef)(null),[l,u]=(0,a.useState)();return(0,a.useEffect)(()=>{let e=setTimeout(()=>{t.current&&(t.current.value="")},300);return()=>{clearTimeout(e)}},[]),a.createElement(r.XK,{query:c},i=>{let{data:o,loading:p}=i;return a.createElement(r.sM,{mutation:d},(r,i)=>{let{data:d,error:g}=(null==o?void 0:o.mailer.settings)||{},y=null==d?void 0:d.source,{loading:v}=i,x=async t=>{var l,a;u([]);let n=null==(l=(await r({variables:{data:t},refetchQueries:[{query:c}],awaitRefetchQueries:!0})).data)?void 0:l.mailer.settings.error;if(n){let t=null==(a=n.data)?void 0:a.errors;t&&u(t),e("Settings not updated! Please check your network and console logs for detailed information.");return}e("Settings updated successfully.")};if("code"===y)return a.createElement(n.SkC,null,a.createElement(n.lwG,null,a.createElement(n.otq,{title:"Mailer Settings"}),a.createElement(n.MOP,null,a.createElement(E.xA,null,a.createElement(E.xA.Column,{span:12},a.createElement(E.Fc,{title:"Managed by code",type:"info"},"Mailer settings are managed by code. Edit"," ",a.createElement("code",null,"webiny.config.tsx")," to change them.")),a.createElement(E.xA.Column,{span:12},a.createElement(E.pd,{size:"lg",type:"text",label:"Hostname",value:(null==d?void 0:d.host)??"",disabled:!0})),a.createElement(E.xA.Column,{span:12},a.createElement(E.pd,{size:"lg",type:"number",label:"Port",value:String((null==d?void 0:d.port)??""),disabled:!0})),a.createElement(E.xA.Column,{span:12},a.createElement(E.pd,{size:"lg",type:"text",label:"User",value:(null==d?void 0:d.user)??"",disabled:!0})),a.createElement(E.xA.Column,{span:12},a.createElement(E.pd,{size:"lg",type:"text",label:"From",value:(null==d?void 0:d.from)??"",disabled:!0})),a.createElement(E.xA.Column,{span:12},a.createElement(E.pd,{size:"lg",type:"text",label:"Reply-To",value:(null==d?void 0:d.replyTo)??"",disabled:!0})))),a.createElement(n.ODx,null,"")));if(g)return a.createElement(n.lwG,null,a.createElement(n.otq,{title:"Mailer Settings"}),a.createElement(n.MOP,null,a.createElement(E.xA,null,a.createElement(E.xA.Column,{span:12},a.createElement(E.Fc,{title:g.message,type:"danger"})))),a.createElement(n.ODx,null,""));let b=[];return(null==d?void 0:d.user)||b.push(s.Eq.create("required,minLength:5")),a.createElement(n.SkC,null,a.createElement(m.lV,{data:d||{},onSubmit:e=>{x(e)}},e=>{let{Bind:r,form:m}=e;return a.createElement(n.lwG,null,(p||v)&&a.createElement(E.Ud,null),a.createElement(n.otq,{title:"Mailer Settings"}),a.createElement(n.MOP,null,l?a.createElement(a.Fragment,null,l.map(e=>{let t=e.path[0];return t?a.createElement(E.Fc,{key:`${t}`,title:"Error",type:"danger"},e.message):null})):null,a.createElement(E.xA,null,a.createElement(E.xA.Column,{span:12},a.createElement(r,{name:"host",validators:[s.Eq.create("required,minLength:1")]},a.createElement(E.pd,{size:"lg",type:"text",label:"Hostname"}))),a.createElement(E.xA.Column,{span:12},a.createElement(r,{name:"port"},a.createElement(E.pd,{size:"lg",type:"number",label:"Port"}))),a.createElement(E.xA.Column,{span:12},a.createElement(r,{name:"user",validators:[s.Eq.create("required,minLength:1")]},a.createElement(E.pd,{size:"lg",type:"text",label:"User",autoComplete:"new-password"}))),a.createElement(E.xA.Column,{span:12},a.createElement(r,{name:"password",validators:b},a.createElement(E.pd,{size:"lg",label:"Password",type:"password",autoComplete:"new-password",value:"",inputRef:t}))),a.createElement(E.xA.Column,{span:12},a.createElement(r,{name:"from",validators:[s.Eq.create("required,minLength:1,email")]},a.createElement(E.pd,{size:"lg",type:"text",label:"Mail from"}))),a.createElement(E.xA.Column,{span:12},a.createElement(r,{name:"replyTo",validators:[s.Eq.create("email")]},a.createElement(E.pd,{size:"lg",type:"text",label:"Mail reply-to"}))))),a.createElement(n.ODx,null,a.createElement(E.$n,{text:"Save",onClick:e=>{m.submit(e)}})))}))})})}}}]);