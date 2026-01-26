import './App.css';
import { NavButton } from './components/NavButton';
import { Clicker } from './components/Clicker';
import { UpgradeButton } from './components/UpgradeButton';
import { useState, useEffect } from 'react';

const BACKEND_URL = "https://tqa-backend.up.railway.app";

function App() {

  if(!window.Telegram?.WebApp?.initDataUnsafe?.user?.id){
    document.body.style.backgroundColor = "black";
    return(<>
      <p style={{color: "white"}}>Open in Telegram to continue.</p>
    </>)
  }

  const initData = window.Telegram?.WebApp?.initData;

  useEffect(() => {
    const authenticate = async () => {
      try{
        const res = await fetch(`${BACKEND_URL}/api/auth/telegram`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(initData)});

        const data = await res.json();

        if(!res.ok)
        {
          console.error(data.error);
          return;
        }

        localStorage.setItem("jwt", data.token);
      }
      catch (err){
        console.error("Failed to authenticate. Error: ", err);
      }
    }

    authenticate();
  }, []);

  window.Telegram?.WebApp?.setBackgroundColor("#0D0B0B");
  window.Telegram?.WebApp?.setHeaderColor("#0D0B0B");

  const [leaderboard, setLeaderboard] = useState(["Loading the leaderboard..."]);

  useEffect(() => {
    fetch("https://tqa-backend.up.railway.app/api/leaderboard").then(data => data.json()).then(res => {setLeaderboard(res.leaderboard)});
  }, []);

  return (
    <>
      <nav>
          <NavButton text="About Us🚀" link="#about"></NavButton>
          <NavButton text="Game🎯" link="#game"></NavButton>
          <NavButton text="Upgrades💪" link="#upgrades"></NavButton>
          <NavButton text="Leaderboards🏆" link="#leaderboards"></NavButton>
      </nav>

      <div id="about">
        <h2>About us🚀</h2>
        <p>Welcome to the official playground of the Telegram TQA mini-app!
        
        We’re the same mad geniuses (questionable) and passionate degenerates (confirmed) behind the $TQA meme coin. Our mission has always been simple: to build a fun, unstoppable community where humor meets crypto.

        While the main token is our rocket ship, this Telegram Mini App is yours playground, where you can tap and earn TQA coins, you also can involve the friends and see leaderboards, use improvements to level up your income.</p>
      </div>

      <div id="game">
        <h2>Clicker👆</h2>
        <Clicker></Clicker>
        <p>*click to earn TQA coins✨*</p>
      </div>

      <div id="upgrades">
        <h2>Upgrades💪</h2>
        <div className="upgrade-container">
          <UpgradeButton title='Upgrade1' desc='Lorem ipsum dolor sit amet.' cost={100}></UpgradeButton>
          <UpgradeButton title='Upgrade2' desc='Lorem ipsum dolor sit amet.' cost={1000}></UpgradeButton>
          <UpgradeButton title='Upgrade2' desc='Lorem ipsum dolor sit amet.' cost={10000}></UpgradeButton>
        </div>
      </div>

      <div id="leaderboards">
        <h2>Leaderboards🏆</h2>
        {
          (Array.isArray(leaderboard) && leaderboard.length > 0) ? leaderboard.map((line, index) => (<p key={index} className='leaderboard-row'>{line}</p>)) : (<p>No coin earners yet👀</p>)
        }
      </div>
      
      <footer>
        <p>with love from tqa❤️ v0.2</p>
      </footer>
    </>
  )
}

export default App