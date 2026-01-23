import { useEffect, useState } from "react";

interface ClickerProps {
  startCount?: number;
}

const BACKEND_URL = "https://tqa-backend.up.railway.app";
const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
const initData = window.Telegram?.WebApp?.initData;

export function Clicker({ startCount = 0 }: ClickerProps) {
  const [count, setCount] = useState(startCount);
  const [mult, setMult] = useState(1);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/getcoins/${telegramId}`).then(data => data.json()).then(res => {setCount(res.coins)}).finally(() => {setLoading(false)});
    fetch(`${BACKEND_URL}/api/getmult/${telegramId}`).then(data => data.json()).then(res => {setMult(res.multiplier)});
  }, [telegramId]);

  useEffect(() => {
    window.Telegram?.WebApp?.expand();
    window.Telegram?.WebApp?.ready();
  }, []);

  async function click(){
    const res = await fetch(`${BACKEND_URL}/api/addcoins`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({initData: initData})});

    const data = await res.json();

    if(!res.ok){
      console.error(data.error);
      return;
    }

    setCount(data.new_coins);
  }

  return (
    <div className="clicker">
      <h2 className="clicker-count">{isLoading ? "Loading your coins..." : Number(count).toFixed(6) + " TQA"}</h2>
      <p>Coin multiplier: {mult}</p>
      <input
        type="button"
        className="clicker-button"
        onClick={click}
      />
    </div>
  );
}
