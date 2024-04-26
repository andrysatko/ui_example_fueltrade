import { useState } from "react"

export default  function MesageInput ({send}:{send: (val: string)=> void}){
    const [value , setvalue] = useState("")
    return (
        <>
        <input type="text" placeholder="Type your message" value={value} onChange={(e)=>setvalue(e.target.value)}/>
        <button onClick={()=>send(value)}>send </button>
        </>
    )
}