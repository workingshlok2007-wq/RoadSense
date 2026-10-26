import type { ButtonHTMLAttributes, ReactNode } from 'react'
export const Button=({className='',...p}:ButtonHTMLAttributes<HTMLButtonElement>)=><button className={`btn ${className}`} {...p}/>
export const Card=({children,className=''}:{children:ReactNode,className?:string})=><section className={`card ${className}`}>{children}</section>
export const Badge=({children,tone='slate'}:{children:ReactNode,tone?:string})=><span className={`badge ${tone}`}>{children}</span>
export const Heading=({children,sub}:{children:ReactNode,sub?:string})=><header className="page-head"><div><p className="eyebrow">RoadSense municipal intelligence</p><h1>{children}</h1>{sub&&<p>{sub}</p>}</div></header>
export const Skeleton=()=> <div className="skeleton" aria-label="Loading data"><i/><i/><i/></div>
export const Empty=({text='No reports match these filters.'}:{text?:string})=><div className="empty"><strong>No results</strong><span>{text}</span></div>
