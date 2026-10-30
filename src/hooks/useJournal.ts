import { useState } from 'react';
type Journal = {checks:Record<string,string[]>;dates:string[]};
const KEY='ielts-workspace.journal.v1';
export function useJournal(notify:(message:string)=>void){
 const [data,setData]=useState<Journal>(()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');return {checks:d.checks&&typeof d.checks==='object'?d.checks:{},dates:Array.isArray(d.dates)?d.dates.filter((s:unknown)=>typeof s==='string'):[]};}catch{return {checks:{},dates:[]};}});
 const now=new Date();const day=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const persist=(next:Journal)=>{try{localStorage.setItem(KEY,JSON.stringify(next));setData(next);}catch{notify('打卡保存失败，请检查浏览器存储空间。');}};
 return {checks:data.checks[day]||[],dates:data.dates,toggleCheck:(id:string)=>{const old=data.checks[day]||[];persist({...data,checks:{...data.checks,[day]:old.includes(id)?old.filter(s=>s!==id):[...old,id]}});},checkIn:()=>{if(!data.dates.includes(day))persist({...data,dates:[...data.dates,day]});}};
}
