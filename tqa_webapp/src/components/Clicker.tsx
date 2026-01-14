import { useState } from "react"

interface ClickerProps{
    startCount?: number;
}

export function Clicker({ startCount = 0 }: ClickerProps){
    const [count, setCount] = useState(startCount);

    return(
    <>
        <div className="clicker">
            <h2 className="clicker-count" id="clicker-count">{count.toFixed(3)}</h2>
            <input type="button" onClick={() => setCount(count + 0.001)} className="clicker-button" id="clicker-button"/>
        </div>
    </>
    )
}