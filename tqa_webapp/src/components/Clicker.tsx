import { useEffect, useState } from "react";

interface ClickerProps {
  startCount?: number;
  fetchWithAuth: (url: string, options?: any) => Promise<Response>;
}

const BACKEND_URL = "https://tqa-backend.up.railway.app";

export function Clicker({ startCount = 0, fetchWithAuth }: ClickerProps) {
  const [count, setCount] = useState<number>(startCount);
  const [mult, setMult] = useState<number>(1);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/me`);
      const data = await res.json();

      if (res.ok) {
        setCount(data.balance);
        setMult(data.coin_multiplier);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    window.Telegram?.WebApp.expand();
    window.Telegram?.WebApp.ready();
  }, []);

  async function click() {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/addcoins`, {
      method: "POST"
    });

    const data = await res.json();
    if (!res.ok) return console.error(data.error);

    setCount(data.balance);
  }

  return (
    <div className="clicker">
      <h2 className="clicker-count">
        {isLoading ? "Loading..." : count.toFixed(6) + " TQA"}
      </h2>
      <p>Multiplier: {mult}x💎</p>
      <input
        type="button"
        className="clicker-button"
        onClick={click}
      />
    </div>
  );
}
