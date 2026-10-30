// Shared, deterministic pixel artwork; the mascot appears only in the home hero.
export default function PixelArt({kind}:{kind:'mascot'|'books'|'Reading'|'Listening'|'Writing'|'Speaking'}) {
 const ink='#59483d',cream='#fff7e6',sage='#a6b494',purple='#c7b5d5',peach='#eac5aa';
 return <svg className={`pixel-art art-${kind}`} viewBox="0 0 160 110" role="img" aria-label={kind === 'mascot' ? '头顶四叶草的奶油白档案豚鼠' : `${kind} 像素插画`} shapeRendering="crispEdges">
 <path d="M17 98h126v4H17z" fill="#cfccad"/>
 {kind === 'mascot' ? <>
 <path d="M37 89V61h7V47h10V35h17v-6h35v6h17v13h9v15h6v26h-9v8H46v-8z" fill={ink}/>
 <path d="M42 86V62h7V49h10V39h15v-5h29v6h17v12h8v15h5v18h-8v8H50v-7z" fill={cream}/>
 <path d="M112 44h8v12h8v14h5v14h-11v6h-14v-7h-7V66h6V51h5z" fill="#b5bda1"/>
 <path d="M53 46V36h12v5h8v11H61v-6z" fill={peach}/><path d="M110 45V35h12v7h5v13h-10V45z" fill={peach}/>
 <path d="M67 63h5v8h-5zm37 0h5v8h-5zM85 75h7v4h-7zM87 79h3v4h-3z" fill={ink}/>
 <path d="M59 75h12v5H59zm47 0h12v5h-12z" fill="#e9b6a6"/>
 <path d="M56 91h12v5H56zm42 0h12v5H98z" fill={peach}/>
 <path d="M91 12V7h9v5h7v9h-7v7h-9v-7h-7v-9zM93 28h4v14h-4z" fill={ink}/>
 <path d="M92 10h5v6h-5zM87 14h5v5h-5zM99 14h5v5h-5zM92 20h5v5h-5z" fill="#a3b88d"/>
 <path d="M137 82h19v12h-19zM140 68h16v12h-16zM136 54h20v12h-20z" fill={ink}/><path d="M139 85h17v6h-17zM143 71h13v6h-13zM139 57h17v6h-17z" fill={purple}/>
 </> : kind === 'Listening' ? <>
 <path d="M40 72V40h8V27h13v-7h40v7h12v13h7v32h-10V43h-6V33H57v10h-7v29z" fill={ink}/><path d="M44 53V39h8V29h12v-5h34v6h10v11h8v12h-6V42h-9V34H59v9h-9v10z" fill={purple}/>
 <path d="M34 54h24v35H34zM102 54h24v35h-24z" fill={ink}/><path d="M38 58h16v27H38zM106 58h16v27h-16z" fill={sage}/><path d="M45 58h4v27h-4zM113 58h4v27h-4z" fill="#dce2c7"/>
 </> : kind === 'Speaking' ? <>
 <path d="M25 30h65v7h8v32h-8v7H53L39 89V76H25v-7h-7V37h7z" fill={ink}/><path d="M26 35h60v6h7v24h-7v6H49l-6 7v-7H27v-6h-4V42h4z" fill={cream}/><path d="M76 58h62v6h6v28h-7v7h-15v9l-12-9H76v-6h-7V65h7z" fill={ink}/><path d="M78 63h57v5h5v21h-6v6h-17v6l-6-6H79v-6h-5V68h4z" fill="#e6e9d4"/><path d="M40 50h5v5h-5zm17 0h5v5h-5zm17 0h5v5h-5zm13 27h5v5h-5zm16 0h5v5h-5zm16 0h5v5h-5z" fill={ink}/>
 </> : kind === 'books' ? <>
 {[0,1,2].map(i=><g key={i}><path d={`M${30+i*5} ${29+i*22}h95v18H${30+i*5}z`} fill={ink}/><path d={`M${34+i*5} ${32+i*22}h87v12H${34+i*5}z`} fill={i===1?sage:purple}/><path d={`M${53+i*5} ${33+i*22}h64v10H${53+i*5}z`} fill={cream}/><path d={`M${55+i*5} ${37+i*22}h59v2H${55+i*5}z`} fill="#dcc9ae"/></g>)}
 </> : <>
 <path d="M25 33h15v-5h29v5h22v-5h29v5h14v54h-13v6H94v-5H67v5H38v-6H25z" fill={ink}/><path d="M30 38h11v-5h26v5h11v45H66v5H41v-6H30zM84 38h10v-5h25v5h10v44h-10v6H95v-5H84z" fill={cream}/><path d="M77 39h7v51h-7z" fill={peach}/>
 {[0,1,2,3,4].map(i=><path key={i} d={`M39 ${44+i*7}h29v2H39zM94 ${44+i*7}h25v2H94z`} fill="#ceb79f"/>)}
 {kind==='Writing' && <><path d="M112 24h9v9h-5v40h-6V33h2z" fill={ink}/><path d="M113 34h5v38h-5z" fill={peach}/><path d="M111 73h7l-3 8z" fill={ink}/></>}
 </>}
 <path d="M19 27h3v-5h3v5h4v3h-4v5h-3v-5h-3zM135 20h3v-4h3v4h4v3h-4v4h-3v-4h-3z" fill="#d2b18e"/>
 </svg>;
}
