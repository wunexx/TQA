import { useEffect, useState } from "react";

interface ClickerProps {
  startCount?: number;
}

const BACKEND_URL = "https://tqa-backend.up.railway.app";

export function Clicker({ startCount = 0 }: ClickerProps) {
  const [count, setCount] = useState<number>(startCount);
  const [mult, setMult] = useState<number>(1);
  const [isLoading, setLoading] = useState<boolean>(true);

  const jwt = localStorage.getItem("jwt");

  useEffect(() => {
    if(!jwt) return;

    const fetchData = async () => {
      try{
        const res = await fetch(`${BACKEND_URL}/api/me`, {headers: { Authorization: `Bearer ${jwt}` }});

        const data = await res.json();

        if (res.ok) {
          setCount(data.balance);
          setMult(data.multiplier);
        } else {
          console.error("Failed to fetch user data:", data.error);
        }
      }
      catch(err){
        console.error(err);
      }
      finally{
        setLoading(false);
      }
    };

    fetchData();
  }, [jwt]);

  useEffect(() => {
    window.Telegram?.WebApp?.expand();
    window.Telegram?.WebApp?.ready();
  }, []);

  async function click(){
    if(!jwt){
      console.warn("No jwt, cannot click!");
      return;
    }

    const res = await fetch(`${BACKEND_URL}/api/addcoins`, {method: "POST", headers: {"Content-Type": "application/json", Authorization: `Bearer ${jwt}`}, body: JSON.stringify({})});

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
      <p>Multiplier: {mult}x💎</p>
      <input
        type="button"
        className="clicker-button"
        onClick={click}
      />
    </div>
  );
}
