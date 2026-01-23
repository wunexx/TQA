import { useEffect, useState } from "react";

interface ClickerProps {
  startCount?: number;
}

const BACKEND_URL = "https://tqa-backend.up.railway.app";
const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
const initData = window.Telegram?.WebApp?.initData;

export function Clicker({ startCount = 0 }: ClickerProps) {
  const [count, setCount] = useState(startCount);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/getcoins/${telegramId}`).then(data => data.json()).then(res => {setCount(res.coins)});
  }, [telegramId]);

  useEffect(() => {
    window.Telegram?.WebApp?.expand();
    window.Telegram?.WebApp?.ready();
  }, []);

  async function click(){
    const res = await fetch(`${BACKEND_URL}/api/addcoins`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({initData: initData})});

    const data = await res.json();
    setCount(data.new_coins);
  }

  return (
    <div className="clicker">
      <h2 className="clicker-count">{count.toFixed(6)} TQA</h2>
      <input
        type="button"
        className="clicker-button"
        value="Click me!"
        onClick={click}
      />
    </div>
  );
}
