import { useState, useEffect } from "react"

interface ClickerProps{
    startCount?: number;
}

export function Clicker({ startCount = 0 }: ClickerProps){
    const [count, setCount] = useState(startCount);
    const [multiplier, setMultiplier] = useState(1);
    const [_, setPendingIncrement] = useState(0);

    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const backendUrl = "https://zesty-art-production.up.railway.app";

    useEffect(() => {
        if(!telegramId) return;

        fetch(`${backendUrl}/api/getcoins/${telegramId}`)
            .then(res => res.json())
            .then(data => setCount(data.coins))
            .catch(err => console.error("Failed to sync coins:", err));

        fetch(`${backendUrl}/api/getmult/${telegramId}`)
            .then(res => res.json())
            .then(data => setMultiplier(data.multiplier))
            .catch(err => console.error("Failed to sync multiplier:", err));

        const interval = setInterval(() => {
            setPendingIncrement(prev => {
                if (prev > 0) {
                    fetch(`${backendUrl}/api/addcoins`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ telegram_id: telegramId, amount: prev })
                    }).catch(err => console.error("Failed to add coins:", err));
                }
                return 0;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [telegramId]);

    const [testMsg, setTestMsg] = useState("");

    useEffect(() => {
        fetch(`${backendUrl}/api/test`)
            .then(res => res.json())
            .then(data => setTestMsg(data.hi));
    }, []);


    const handleClick = () => {
        if (!telegramId) return;

        const increment = parseFloat((0.001 * multiplier).toFixed(6));
        setCount(prev => prev + increment);
        setPendingIncrement(prev => prev + increment);
    };

    if (!telegramId) return <p>Open this inside Telegram to play.</p>;

    return(
        <div className="clicker">
            <h2 className="clicker-count">{count.toFixed(6) + " TQA"}</h2>
            <p>{testMsg}</p>
            <input type="button" onClick={handleClick} className="clicker-button"/>
        </div>
    )
}
