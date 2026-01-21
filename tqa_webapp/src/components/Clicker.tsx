import { useEffect, useState } from "react";

interface ClickerProps {
  startCount?: number;
}

const BACKEND_URL = "https://zesty-art-production.up.railway.app";

export function Clicker({ startCount = 0 }: ClickerProps) {
  const [count, setCount] = useState(startCount);
  const [multiplier, setMultiplier] = useState(1);
  const [pendingIncrement, setPendingIncrement] = useState(0);

  const initData = window.Telegram?.WebApp?.initData;
  const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();
  }, []);

  useEffect(() => {
    if (!telegramId) return;

    const fetchUserData = async () => {
      try {
        const [coinsRes, multRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/getcoins/${telegramId}`),
          fetch(`${BACKEND_URL}/api/getmult/${telegramId}`)
        ]);

        const coinsData = await coinsRes.json();
        const multData = await multRes.json();

        setCount(coinsData.coins);
        setMultiplier(multData.multiplier);
      } catch (err) {
        console.error("Failed to sync user data:", err);
      }
    };

    fetchUserData();

    const interval = setInterval(() => {
      setPendingIncrement(prev => {
        if (prev <= 0) return 0;

        fetch(`${BACKEND_URL}/api/addcoins`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initData,
            amount: prev
          })
        }).catch(err => console.error("Failed to add coins:", err));

        return 0;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [telegramId]);

  const handleClick = () => {
    if (!telegramId) return;

    const increment = Number((0.001 * multiplier).toFixed(6));

    setCount(c => c + increment);
    setPendingIncrement(p => p + increment);
  };

  if (!telegramId) {
    return <p>Open this inside Telegram to play.</p>;
  }

  return (
    <div className="clicker">
      <h2 className="clicker-count">{count.toFixed(6)} TQA</h2>
      <input
        type="button"
        className="clicker-button"
        onClick={handleClick}
      />
    </div>
  );
}
