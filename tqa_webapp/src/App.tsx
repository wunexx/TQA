import './App.css';
import { NavButton } from './components/NavButton';
import { Clicker } from './components/Clicker';
import { UpgradeButton } from './components/UpgradeButton';
import { useState, useEffect } from 'react';

const BACKEND_URL = "https://tqa-backend.up.railway.app";

async function fetchWithAuth(url: string, options: any = {}) {
  let accessToken = localStorage.getItem("accessToken");

  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (res.status !== 401) return res;

  const refreshToken = localStorage.getItem("refreshToken");
  const refreshRes = await fetch(`${BACKEND_URL}/api/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });

  const refreshData = await refreshRes.json();
  if (!refreshRes.ok) throw new Error("Session expired");

  localStorage.setItem("accessToken", refreshData.accessToken);
  localStorage.setItem("refreshToken", refreshData.refreshToken);

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${refreshData.accessToken}`
    }
  });
}

function App() {
  if(!window.Telegram?.WebApp?.initDataUnsafe?.user?.id){
    document.body.style.backgroundColor = "black";
    return <p style={{color: "white"}}>Open in Telegram to continue.</p>;
  }

  const initData = window.Telegram.WebApp.initData;

  useEffect(() => {
    const authenticate = async () => {
      const res = await fetch(`${BACKEND_URL}/api/auth/telegram`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ initData })
      });

      const data = await res.json();
      if (!res.ok) return console.error(data.error);

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
    };

    authenticate();
  }, []);

  const [leaderboard, setLeaderboard] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/leaderboard`)
      .then(r => r.json())
      .then(res => {
        setLeaderboard(
          res.map((u: any) => `${u.first_name}: ${u.balance.toFixed(6)} TQA`)
        );
      });
  }, []);

  window.Telegram.WebApp.setBackgroundColor("#0D0B0B");
  window.Telegram.WebApp.setHeaderColor("#0D0B0B");

  return (
    <>
      <nav>
        <NavButton text="About Us🚀" link="#about"/>
        <NavButton text="Game🎯" link="#game"/>
        <NavButton text="Upgrades💪" link="#upgrades"/>
        <NavButton text="Leaderboards🏆" link="#leaderboards"/>
      </nav>

      <div id="about">
        <h2>About us🚀</h2>
        <p>Tap. Earn. Ascend. Repeat.</p>
      </div>

      <div id="game">
        <h2>Clicker👆</h2>
        <Clicker fetchWithAuth={fetchWithAuth}/>
        <p>*click to earn TQA coins✨*</p>
      </div>

      <div id="upgrades">
        <h2>Upgrades💪</h2>
        <div className="upgrade-container">
          <UpgradeButton title='Upgrade1' desc='Lorem ipsum.' cost={100}/>
          <UpgradeButton title='Upgrade2' desc='Lorem ipsum.' cost={1000}/>
          <UpgradeButton title='Upgrade3' desc='Lorem ipsum.' cost={10000}/>
        </div>
      </div>

      <div id="leaderboards">
        <h2>Leaderboards🏆</h2>
        {leaderboard.length
          ? leaderboard.map((l, i) => <p key={i}>{l}</p>)
          : <p>No coin earners yet👀</p>
        }
      </div>

      <footer>
        <p>with love from tqa❤️ v0.2</p>
      </footer>
    </>
  );
}

export default App;
