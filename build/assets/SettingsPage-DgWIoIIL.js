import{B as o,j as e,m as x,r as n,a as d,g as m,d as u,b as f}from"./index-DirEgLJ3.js";import{H as h}from"./Header-DIQgaVcq.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=o("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=o("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]),c=({icon:s,title:t,children:a})=>e.jsxs(x.div,{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-300 mb-8",initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{duration:.5},children:[e.jsxs("div",{className:"flex items-center mb-4",children:[e.jsx(s,{className:"text-indigo-600 mr-4",size:"24"}),e.jsx("h2",{className:"text-xl font-semibold text-gray-800",children:t})]}),a]}),i=({label:s,isOn:t,onToggle:a})=>e.jsxs("div",{className:"flex items-center justify-between py-3",children:[e.jsx("span",{className:"text-gray-800",children:s})," ",e.jsx("button",{className:`
		  relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none
		  ${t?"bg-indigo-500":"bg-gray-300"} /* تعديل الألوان */
		  `,onClick:a,children:e.jsx("span",{className:`inline-block size-4 transform transition-transform bg-white rounded-full 
			  ${t?"translate-x-6":"translate-x-1"}
			  `})})]}),p=()=>{const[s,t]=n.useState({push:!0,email:!1,sms:!0});return e.jsxs(c,{icon:g,title:"Notifications",children:[e.jsx(i,{label:"Push Notifications",isOn:s.push,onToggle:()=>t({...s,push:!s.push})}),e.jsx(i,{label:"Email Notifications",isOn:s.email,onToggle:()=>t({...s,email:!s.email})}),e.jsx(i,{label:"Dark Mode",isOn:s.sms,onToggle:()=>t({...s,sms:!s.sms})})]})},b=()=>{const[s,t]=n.useState(null);return n.useEffect(()=>{(async()=>{const l=d.currentUser;if(l){const r=await m(u(f,"users",l.uid));r.exists()&&t(r.data())}})()},[]),e.jsx(c,{icon:j,title:"Profile",children:s?e.jsx("div",{className:"flex flex-col sm:flex-row items-center mb-6",children:e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-800",children:[s.firstName," ",s.lastName]}),e.jsx("p",{className:"text-gray-600",children:s.email})]})}):e.jsx("p",{children:"Loading..."})})},v=()=>e.jsxs("div",{className:"flex-1 overflow-auto relative z-10 bg-white",children:[e.jsx(h,{title:"Settings"}),e.jsxs("main",{className:"max-w-4xl mx-auto py-6 px-4 lg:px-8",children:[e.jsx(b,{}),e.jsx(p,{})]})]});export{v as default};
