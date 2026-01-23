import './App.css';
import { NavButton } from './components/NavButton';
import { Clicker } from './components/Clicker';
import { useState, useEffect } from 'react';

function App() {

  if(!window.Telegram?.WebApp?.initDataUnsafe?.user?.id){
    document.body.style.backgroundColor = "black";
    return(<>
      <p style={{color: "white"}}>Open in Telegram to continue.</p>
    </>)
  }

  const [leaderboard, setLeaderboard] = useState("Loading the leaderboard...");

  useEffect(() => {
    fetch("https://tqa-backend.up.railway.app/api/getleaderboard").then(data => data.json()).then(res => {setLeaderboard(res.leaderboard)});
  }, [])


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
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>

      <div id="game">
        <h2>Clicker👆</h2>
        <p>*click to earn TQA coins✨*</p>
        <Clicker></Clicker>
      </div>

      <div id="upgrades">
        <h2>Upgrades💪</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>

      <div id="leaderboards">
        <h2>Leaderboards🏆</h2>
        <p>{leaderboard}</p>
      </div>
      
      <footer>
        <p>with love from tqa❤️ v0.2</p>
      </footer>
    </>
  )
}

export default App
