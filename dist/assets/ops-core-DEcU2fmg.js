const l=s=>{let t;const c=new Set,o=(e,r)=>{const n=typeof e=="function"?e(t):e;if(!Object.is(n,t)){const u=t;t=r??(typeof n!="object"||n===null)?n:Object.assign({},t,n),c.forEach(b=>b(t,u))}},a=()=>t,i={setState:o,getState:a,getInitialState:()=>S,subscribe:e=>(c.add(e),()=>c.delete(e))},S=t=s(o,a,i);return i},d=s=>l(s);export{d as c};
//# sourceMappingURL=ops-core-DEcU2fmg.js.map
