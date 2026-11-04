import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './game-art.css';

const baseGameCatalog = [
  ['Fortune Reels', '🎰', 'Slots', 'amber'], ['Royal Blackjack', '♠️', 'Blackjack', 'emerald'],
  ['Star Roulette', '🎡', 'Roulette', 'ruby'], ['Skybound', '🛩️', 'Crash', 'sky'],
  ['Rocket Ride', '🚀', 'Crash', 'violet'], ['Plinko Party', '🔵', 'Plinko', 'cyan'],
  ['Gem Mines', '💎', 'Mines', 'teal'], ['Tower of Luck', '🗼', 'Tower', 'indigo'],
  ['Lucky Keno', '🎯', 'Keno', 'blue'], ['Golden Wheel', '☸️', 'Wheel', 'gold'],
  ['Dragon Baccarat', '🐉', 'Baccarat', 'red'], ['Scratch Society', '🎟️', 'Scratch', 'pink'],
];
const famousGameCatalog = [
  ['Book of Ra', '📖', 'Slots', 'amber'], ['Starburst', '✨', 'Slots', 'cyan'], ['Gates of Olympus', '⚡', 'Slots', 'violet'],
  ['Sweet Bonanza', '🍬', 'Slots', 'pink'], ['Big Bass Bonanza', '🐟', 'Slots', 'blue'], ['Wolf Gold', '🐺', 'Slots', 'gold'],
  ['Legacy of Dead', '🪦', 'Slots', 'amber'], ['Reactoonz', '🪐', 'Slots', 'teal'], ['Buffalo King', '🐂', 'Slots', 'emerald'],
  ['Thunderstruck II', '⚡', 'Slots', 'gold'], ['Mega Moolah', '🦁', 'Slots', 'red'], ['Aztec Gold', '🏺', 'Slots', 'gold'],
  ['Dead or Alive', '🔫', 'Slots', 'ruby'], ['Fruit Spin', '🍇', 'Slots', 'amber'], ['Lucky Larry', '🐠', 'Slots', 'sky'],
  ['Diamond Mine', '💠', 'Slots', 'cyan'], ['Temple of Fire', '🔥', 'Slots', 'red'], ['Hot Fruits', '🍋', 'Slots', 'gold'],
  ['Queen of the Nile', '👑', 'Slots', 'emerald'], ['Royal Panda', '🐼', 'Slots', 'indigo'],
];
const gameCatalog = [...baseGameCatalog, ...famousGameCatalog];
const themes = ['Moon Temple', 'Neon Nights', 'Wild Safari', 'Ocean Treasures', 'Mystic Garden', 'Desert Gold', 'Candy Carnival', 'Jungle Quest', 'Arctic Lights', 'Cosmic Rush'];
const themeIcons = ['🌙', '🌃', '🦁', '🪼', '🌸', '💎', '🍭', '🌿', '❄️', '🪐'];
const games = gameCatalog.flatMap(([title, emoji, mode, palette], group) => themes.map((theme, index) => ({
  id: group * 10 + index + 1, title: `${theme} ${title}`, emoji, mode, palette, themeIndex: index, themeIcon: themeIcons[index],
  featured: index === 0 && group < 3, studio: 'LuckyLane Originals',
})));
const lobbyTabs = ['All games', 'Popular', 'New releases', 'Jackpot', 'Exclusive'];
const categories = ['All games', 'Slots', 'Blackjack', 'Roulette', 'Crash', 'Plinko', 'Mines', 'Tower', 'Keno', 'Wheel', 'Baccarat', 'Scratch'];
const modes = { Slots: 'Video slot', Blackjack: 'Blackjack', Roulette: 'European roulette', Crash: 'Crash game', Plinko: 'Plinko', Mines: 'Mines', Tower: 'Tower climb', Keno: 'Keno', Wheel: 'Prize wheel', Baccarat: 'Baccarat', Scratch: 'Scratch card' };
const initialBalance = 10000;
const money = (n) => Math.max(0, Math.floor(n)).toLocaleString();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const profileStore = 'luckylane-demo-profiles';
const rouletteRed = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const slotopolPrefix = '/slotopol';

async function slotopolRequest(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${slotopolPrefix}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.what || payload.error || `Slotopol request failed (${response.status})`);
  return payload.ret || payload;
}

async function passwordDigest(password, salt) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function App() {
  const [balance, setBalance] = useState(() => {
    const savedBalance = localStorage.getItem('luckylane-balance');
    return savedBalance === null || !Number.isFinite(Number(savedBalance)) ? initialBalance : Number(savedBalance);
  });
  const [plays, setPlays] = useState(() => Number(localStorage.getItem('luckylane-plays')) || 0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All games');
  const [lobbyTab, setLobbyTab] = useState('All games');
  const [activeGame, setActiveGame] = useState(null);
  const [bet, setBet] = useState(50);
  const [notice, setNotice] = useState('');
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('luckylane-favorites') || '[]'));
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [account, setAccount] = useState(() => localStorage.getItem('luckylane-demo-session') || '');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('register');
  const [slotopolSession, setSlotopolSession] = useState(() => JSON.parse(sessionStorage.getItem('luckylane-slotopol-session') || 'null'));
  const [slotopolGames, setSlotopolGames] = useState([]);
  const [slotopolOpen, setSlotopolOpen] = useState(false);
  const [slotopolError, setSlotopolError] = useState('');
  const [slotopolBusy, setSlotopolBusy] = useState(false);
  const [catalogSource, setCatalogSource] = useState('luckylane');

  useEffect(() => localStorage.setItem('luckylane-balance', String(balance)), [balance]);
  useEffect(() => localStorage.setItem('luckylane-plays', String(plays)), [plays]);
  useEffect(() => localStorage.setItem('luckylane-favorites', JSON.stringify(favorites)), [favorites]);

  const catalogGames = catalogSource === 'slotopol' ? slotopolGames : games;
  const filteredGames = useMemo(() => catalogGames.filter((game) => {
    const matchesText = game.title.toLowerCase().includes(query.toLowerCase()) || game.mode.toLowerCase().includes(query.toLowerCase());
    const matchesTab = catalogSource === 'slotopol' || lobbyTab === 'All games' || lobbyTab === 'Popular' && game.id <= 24 || lobbyTab === 'New releases' && game.id > 96 || lobbyTab === 'Jackpot' && game.mode === 'Slots' || lobbyTab === 'Exclusive' && game.id % 4 === 0;
    return matchesText && matchesTab && (category === 'All games' || game.mode === category) && (!favoritesOnly || favorites.includes(game.id));
  }), [catalogGames, catalogSource, category, favorites, favoritesOnly, lobbyTab, query]);
  const featuredGames = games.filter((game) => game.featured);

  function toggleFavorite(id) {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function startGame(game) {
    if (game.source === 'slotopol') {
      if (!slotopolSession) {
        setSlotopolOpen(true);
        setSlotopolError('Connect your Slotopol demo account before launching its games.');
        return;
      }
    }
    setActiveGame(game);
    setBet(50);
    setNotice('');
  }
  function play(result, multiplier = 0) {
    if (balance < bet) {
      setNotice('Not enough demo credits. Add a free refill to keep playing!');
      return;
    }
    const payout = Math.floor(bet * multiplier);
    setBalance((current) => current - bet + payout);
    setPlays((current) => current + 1);
    setNotice(`${result}${payout ? ` · +${money(payout)} credits` : ` · −${money(bet)} credits`}`);
  }
  function refill() {
    setBalance((current) => current + 5000);
    setNotice('5,000 free demo credits added. Have fun!');
  }

  async function connectSlotopol(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const secret = String(formData.get('secret') || '');
    const clubId = Number(formData.get('clubId'));
    if (!Number.isInteger(clubId) || clubId < 1) {
      setSlotopolError('Enter the club ID configured on your Slotopol server.');
      return;
    }
    setSlotopolBusy(true);
    setSlotopolError('');
    try {
      const user = await slotopolRequest(`/signis?email=${encodeURIComponent(email)}`);
      if (!user.uid) throw new Error('No Slotopol account found for that email.');
      const auth = await slotopolRequest('/signin', { method: 'POST', body: { email, secret } });
      if (!auth.access) throw new Error('Slotopol did not return an access token.');
      const session = { uid: Number(user.uid), clubId, token: auth.access, email };
      const algorithms = await slotopolRequest('/game/algs', { token: session.token });
      const remoteGames = (Array.isArray(algorithms) ? algorithms : algorithms.algs || []).flatMap((algorithm) => (algorithm.aliases || []).map((alias) => ({
        id: `slotopol:${alias.prov}:${alias.name}`,
        title: alias.name,
        provider: alias.prov,
        alias: `${alias.prov}/${alias.name}`,
        mode: 'Slots',
        emoji: '🎰',
        themeIcon: '✨',
        palette: 'amber',
        themeIndex: 0,
        source: 'slotopol',
        studio: `${alias.prov} · Slotopol simulation`,
        rtp: algorithm.rtp,
      })));
      if (!remoteGames.length) throw new Error('The Slotopol server returned no slot aliases. Check that games are enabled.');
      setSlotopolGames(remoteGames);
      setSlotopolSession(session);
      sessionStorage.setItem('luckylane-slotopol-session', JSON.stringify(session));
      setCatalogSource('slotopol');
      setCategory('All games');
      setLobbyTab('All games');
      setSlotopolOpen(false);
    } catch (error) {
      setSlotopolError(error.message || 'Could not connect to Slotopol. Check the proxy, server, and credentials.');
    } finally {
      setSlotopolBusy(false);
    }
  }

  function disconnectSlotopol() {
    sessionStorage.removeItem('luckylane-slotopol-session');
    setSlotopolSession(null);
    setSlotopolGames([]);
    setCatalogSource('luckylane');
  }

  return <div className="app-shell">
    <header className="topbar">
      <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMobileMenu(!mobileMenu)}>☰</button>
      <a className="brand" href="#home" aria-label="LuckyLane home"><span className="brand-mark">L</span><span>lucky<span className="brand-light">lane</span><i>.</i></span></a>
      <nav className={`top-nav ${mobileMenu ? 'open' : ''}`}>
        <a className="nav-link active" href="#lobby" onClick={() => setMobileMenu(false)}>Casino</a>
        <a className="nav-link" href="#games" onClick={() => { setLobbyTab('All games'); setCategory('All games'); setMobileMenu(false); }}>All games</a>
        <button className={`nav-link ${category === 'Crash' ? 'active' : ''}`} onClick={() => { setCategory('Crash'); setLobbyTab('All games'); document.querySelector('#games')?.scrollIntoView(); setMobileMenu(false); }}>Crash</button>
        <button className={`nav-link ${favoritesOnly ? 'active' : ''}`} onClick={() => { setFavoritesOnly(!favoritesOnly); setMobileMenu(false); }}>♡ Favorites</button>
        <button className={`nav-link ${catalogSource === 'slotopol' ? 'active' : ''}`} onClick={() => { if (slotopolSession) { setCatalogSource('slotopol'); setCategory('All games'); document.querySelector('#games')?.scrollIntoView(); } else setSlotopolOpen(true); setMobileMenu(false); }}>Slotopol games</button>
      </nav>
      <div className="header-actions">
        <div className="balance-pill"><span className="coin">✦</span><span className="balance-copy"><small>DEMO CREDITS</small><strong>{money(balance)}</strong></span></div>
        <button className="add-button" onClick={refill}><span>＋</span><span className="add-label">Add credits</span></button>
        {account ? <button className="account-button" onClick={() => { localStorage.removeItem('luckylane-demo-session'); setAccount(''); }}>{account.slice(0, 1).toUpperCase()} · Log out</button> : <div className="auth-actions"><button className="login-button" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>Log in</button><button className="register-button" onClick={() => { setAuthMode('register'); setAuthOpen(true); }}>Sign up</button></div>}
      </div>
    </header>

    <main id="lobby">
      <section className="hero wrap" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> YOUR LUCKY PLACE</div>
          <h1>Big games.<br /><span>Zero stakes.</span></h1>
          <p>Kick back, pick a game, and let the good times roll. It’s all for fun with free demo credits.</p>
          <div className="hero-ctas"><a className="button button-primary" href="#games">Explore games <span>↗</span></a><span className="player-note"><span className="avatar-stack"><i>J</i><i>M</i><i>K</i></span> <b>2.4k</b> playing for fun</span></div>
          <div className="hero-footnote">✦ &nbsp;100% free to play <span>·</span> No real money</div>
        </div>
        <div className="hero-art" aria-label="Colorful lucky casino game illustration">
          <div className="art-glow" /><div className="floating-chip chip-one">✦</div><div className="floating-chip chip-two">7</div>
          <div className="hero-wheel"><div className="wheel-inner">🍀</div><span className="wheel-label label-top">LUCKY</span><span className="wheel-label label-bottom">LANE</span></div>
          <div className="hero-card card-left"><span>♣</span><b>7</b><small>LUCKY</small></div><div className="hero-card card-right"><span>♦</span><b>A</b><small>LUCKY</small></div>
          <div className="spark spark-a">✦</div><div className="spark spark-b">✧</div><div className="spark spark-c">✦</div>
          <div className="art-caption"><span className="caption-icon">✧</span><span><b>Good vibes only</b><small>Your next favorite is waiting</small></span><span className="caption-arrow">↗</span></div>
        </div>
      </section>

      <section className="quick-stats wrap" aria-label="Your play stats">
        <div className="stat"><span className="stat-icon purple">🎮</span><span><small>GAMES PLAYED</small><strong>{money(plays)}</strong></span></div>
        <div className="stat"><span className="stat-icon yellow">✦</span><span><small>YOUR BALANCE</small><strong>{money(balance)} <em>credits</em></strong></span></div>
        <div className="stat"><span className="stat-icon green">♧</span><span><small>REAL MONEY</small><strong>Never. Ever.</strong></span></div>
        <button className="stat-help" onClick={() => setNotice('All credits are free virtual points. They cannot be purchased or exchanged for real money.')}>How it works <span>↗</span></button>
      </section>

      <section className="featured-section wrap">
        <div className="section-heading"><div><div className="eyebrow">A LITTLE SOMETHING SPECIAL</div><h2>Hot right now <span className="heading-spark">✦</span></h2></div><a href="#games" className="text-link">See all games <span>→</span></a></div>
        <div className="featured-grid">{featuredGames.map((game, i) => <GameCard key={game.id} game={game} index={i} favorite={favorites.includes(game.id)} onFavorite={toggleFavorite} onPlay={startGame} featured />)}</div>
      </section>

      <section className="games-section wrap" id="games">
        <div className="section-heading game-heading"><div><div className="eyebrow">{catalogSource === 'slotopol' ? 'SELF-HOSTED SLOT SIMULATIONS' : 'THE LUCKY LANE COLLECTION'}</div><h2>{catalogSource === 'slotopol' ? 'Slotopol game catalog' : 'Find your next favorite'} <span className="library-count">{catalogGames.length} GAMES</span></h2></div><label className="search-box"><span>⌕</span><input aria-label="Search games" placeholder="Search games..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></label></div>
        <div className="catalog-switch"><button className={catalogSource === 'luckylane' ? 'source-active' : ''} onClick={() => setCatalogSource('luckylane')}>LuckyLane originals <span>120</span></button><button className={catalogSource === 'slotopol' ? 'source-active' : ''} onClick={() => { if (slotopolSession) setCatalogSource('slotopol'); else { setSlotopolError('Connect to your Slotopol server to load its catalog.'); setSlotopolOpen(true); } }}>Slotopol server {slotopolSession && <span>{slotopolGames.length}</span>}</button>{slotopolSession && <button className="source-disconnect" onClick={disconnectSlotopol}>Disconnect</button>}</div>
        {catalogSource === 'luckylane' && <div className="lobby-tabs">{lobbyTabs.map((tab) => <button key={tab} className={`lobby-tab ${lobbyTab === tab ? 'selected' : ''}`} onClick={() => setLobbyTab(tab)}>{tab === 'Popular' ? '♨ ' : tab === 'Jackpot' ? '✦ ' : ''}{tab}</button>)}</div>}
        <div className="catalog-toolbar"><div className="category-list">{categories.map((item) => <button key={item} className={`category-button ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div><span className="results-count">{filteredGames.length} games</span></div>
        {filteredGames.length > 0 ? <div className="game-grid">{filteredGames.map((game, i) => <GameCard key={game.id} game={game} index={i} favorite={favorites.includes(game.id)} onFavorite={toggleFavorite} onPlay={startGame} />)}</div> : <div className="empty-state"><span>🃏</span><h3>No games found</h3><p>Try another search or category.</p><button className="button button-primary" onClick={() => { setQuery(''); setCategory('All games'); setFavoritesOnly(false); }}>Show all games</button></div>}
      </section>
      <footer className="footer wrap"><a className="brand footer-brand" href="#home"><span className="brand-mark">L</span><span>lucky<span className="brand-light">lane</span><i>.</i></span></a><div className="footer-disclaimer"><span>✦</span> This is a free social casino experience. Demo credits have no cash value and are never redeemable.</div><span className="copyright">© 2026 LuckyLane</span></footer>
    </main>

    {notice && !activeGame && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
    {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthOpen(false)} onAuthenticated={(email) => { setAccount(email); localStorage.setItem('luckylane-demo-session', email); setAuthOpen(false); }} />}
    {slotopolOpen && <SlotopolConnectModal error={slotopolError} busy={slotopolBusy} onClose={() => { setSlotopolOpen(false); setSlotopolError(''); }} onSubmit={connectSlotopol} />}
    {activeGame && (activeGame.source === 'slotopol' ? <SlotopolGameModal game={activeGame} session={slotopolSession} onClose={() => setActiveGame(null)} /> : <ProfessionalGameModal game={activeGame} balance={balance} bet={bet} setBet={setBet} onClose={() => setActiveGame(null)} onPlay={play} onRefill={refill} notice={notice} setNotice={setNotice} />)}
  </div>;
}

function AuthModal({ mode, setMode, onClose, onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const profiles = JSON.parse(localStorage.getItem(profileStore) || '{}');
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === 'register') {
        if (profiles[normalizedEmail]) throw new Error('An account already exists here. Try logging in.');
        const salt = crypto.randomUUID();
        profiles[normalizedEmail] = { salt, digest: await passwordDigest(password, salt) };
        localStorage.setItem(profileStore, JSON.stringify(profiles));
      } else {
        const profile = profiles[normalizedEmail];
        if (!profile || await passwordDigest(password, profile.salt) !== profile.digest) throw new Error('Email or password is incorrect.');
      }
      onAuthenticated(normalizedEmail);
    } catch (reason) {
      setError(reason.message || 'This browser cannot create a demo account right now.');
    } finally {
      setBusy(false);
    }
  }
  return <div className="modal-backdrop auth-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="close-button auth-close" onClick={onClose} aria-label="Close account window">×</button>
      <div className="auth-brand"><span className="brand-mark">L</span></div>
      <div className="auth-eyebrow">YOUR LUCKY PLACE</div>
      <h2 id="auth-title">{mode === 'register' ? 'Join the fun' : 'Welcome back'}</h2>
      <p className="auth-description">{mode === 'register' ? 'Create a free demo account to keep your favorites close.' : 'Log in to your local LuckyLane demo account.'}</p>
      <div className="auth-tabs"><button className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError(''); }}>Sign up</button><button className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); }}>Log in</button></div>
      <form className="auth-form" onSubmit={submit}>
        <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'One moment…' : mode === 'register' ? 'Create demo account' : 'Log in'} <span>↗</span></button>
      </form>
      <p className="auth-legal">Demo account stored in this browser only. Not a real casino account; do not use a password you use elsewhere.</p>
    </section>
  </div>;
}

function GameLogo({ game, compact = false }) {
  return <span className={`game-logo logo-palette-${game.palette} ${compact ? 'game-logo-compact' : ''}`} aria-hidden="true">
    <span className="game-logo-halo" />
    <span className="game-logo-orbit"><i>✦</i><i>✧</i><i>·</i></span>
    <span className="game-logo-medallion"><span className="game-logo-icon">{game.emoji || '✦'}</span></span>
    {!compact && <span className="game-logo-label">{game.mode}</span>}
  </span>;
}

function GameCard({ game, index, favorite, onFavorite, onPlay, featured = false }) {
  return <article className={`game-card ${featured ? 'featured-card' : ''}`} style={{ '--card-delay': `${Math.min(index % 12, 8) * 28}ms` }}>
    <button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'} onClick={(event) => { event.stopPropagation(); onFavorite(game.id); }}>{favorite ? '♥' : '♡'}</button>
    <button className={`game-art bg-${index % 8} game-art-${game.palette} cover-theme-${game.themeIndex}`} onClick={() => onPlay(game)} aria-label={`Play ${game.title}`}>
      <div className="poster-gloss" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
      <span className="cover-studio">LUCKY LANE <i>ORIGINAL</i></span><span className="cover-world">{game.themeIcon}</span><GameLogo game={game} />
      <span className="cover-title">{game.title.replace(': ', '\n')}</span><span className="cover-mode">{game.mode.toUpperCase()} · DEMO PLAY</span>
      {featured && <span className="hot-badge">✦ FEATURED</span>}
      <span className="play-overlay"><span>▶</span></span>
    </button>
    <div className="game-info"><div><h3>{game.title}</h3><span className="game-type">{game.mode} <i>·</i> Demo credits</span></div><button className="play-button" aria-label={`Play ${game.title}`} onClick={() => onPlay(game)}>▶</button></div>
  </article>;
}

function GameModal({ game, balance, bet, setBet, onClose, onPlay, onRefill, notice, setNotice }) {
  const [round, setRound] = useState(0);
  const [slots, setSlots] = useState(['🍒', '🍋', '🔔']);
  const [choice, setChoice] = useState('red');
  const [scratch, setScratch] = useState(false);
  const [diceTarget, setDiceTarget] = useState('over');
  const [lastResult, setLastResult] = useState('');
  const [cards, setCards] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [playing, setPlaying] = useState(false);
  const mode = game.mode;
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  function settle(label, multiplier) {
    setLastResult(label);
    setNotice('');
    onPlay(label, multiplier);
    setRound((n) => n + 1);
  }
  function spin() {
    if (balance < bet) return setNotice('Not enough demo credits. Add a free refill to keep playing!');
    const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🍀'];
    const result = Array.from({ length: 3 }, () => pick(symbols));
    setSlots(result);
    const triple = result.every((item) => item === result[0]);
    const pair = new Set(result).size < 3;
    settle(triple ? `Jackpot! Triple ${result[0]}` : pair ? 'Nice! A matching pair' : 'No match this time', triple ? 8 : pair ? 1.5 : 0);
  }
  function roulette() {
    if (balance < bet) return setNotice('Not enough demo credits. Add a free refill to keep playing!');
    const number = Math.floor(Math.random() * 37);
    const color = number === 0 ? 'green' : number % 2 ? 'red' : 'black';
    const win = choice === color;
    settle(`Ball landed on ${number} · ${color}${win ? ' — you got it!' : ''}`, win ? (choice === 'green' ? 14 : 2) : 0);
  }
  function rollDice() {
    if (balance < bet) return setNotice('Not enough demo credits. Add a free refill to keep playing!');
    const total = Math.floor(Math.random() * 6) + 1;
    const win = diceTarget === 'over' ? total >= 4 : total <= 3;
    settle(`You rolled a ${total} · ${win ? 'Nice roll!' : 'Try again!'}`, win ? 1.8 : 0);
  }
  function scratchCard() {
    if (balance < bet) return setNotice('Not enough demo credits. Add a free refill to keep playing!');
    const icons = ['💎', '🍀', '⭐', '🎁', '💰', '🌙'];
    const result = Array.from({ length: 3 }, () => pick(icons));
    setSlots(result);
    setScratch(true);
    const matches = result.filter((item) => item === result[0]).length;
    settle(matches === 3 ? `Three ${result[0]} — instant win!` : matches === 2 ? 'Two matching symbols!' : 'No match this card', matches === 3 ? 5 : matches === 2 ? 1.5 : 0);
  }
  function blackjack() {
    if (balance < bet) return setNotice('Not enough demo credits. Add a free refill to keep playing!');
    const draw = () => Math.floor(Math.random() * 10) + 2;
    const player = [draw(), draw()];
    const house = [draw(), draw()];
    setCards(player);
    setDealer(house);
    setPlaying(true);
    const score = (arr) => arr.reduce((sum, value) => sum + value, 0);
    const p = score(player), d = score(house);
    const win = p <= 21 && (d > 21 || p > d);
    const push = p === d;
    settle(`You ${p} · Dealer ${d} — ${win ? 'you win!' : push ? 'push!' : 'dealer wins'}`, win ? 2 : push ? 1 : 0);
  }
  const instructions = { Slots: 'Match symbols across the reels to win.', Blackjack: 'Get closer to 21 than the dealer. Aces count as 11.', Roulette: 'Pick a color and see where the ball lands.', Dice: 'Guess if the dice lands high (4–6) or low (1–3).', Scratch: 'Reveal three symbols. Match two or more to win.' };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="game-modal" role="dialog" aria-modal="true" aria-label={`${game.title} game`}>
      <header className="modal-header"><div className="modal-title"><GameLogo game={game} compact /><div><h2>{game.title}</h2><p>{modes[mode]} <span>·</span> Demo game</p></div></div><button className="close-button" onClick={onClose} aria-label="Close game">×</button></header>
      <div className={`table-area table-${mode.toLowerCase()}`}>
        <div className="table-shine" />
        {mode === 'Slots' && <div className="slot-machine"><div className="slot-label">LUCKY LANE <span>★</span></div><div className="reels">{slots.map((symbol, i) => <div key={`${round}-${i}`} className="reel">{symbol}</div>)}</div><div className="slot-lights">✦　✧　✦　✧　✦</div></div>}
        {mode === 'Blackjack' && <div className="blackjack-stage"><div className="hand-label">DEALER {playing && <b>{dealer.reduce((a, b) => a + b, 0)}</b>}</div><div className="playing-cards">{(dealer.length ? dealer : [7, 11]).map((v, i) => <div className={`playing-card ${i === 1 && !playing ? 'card-back' : ''}`} key={`d-${i}`}>{i === 1 && !playing ? '✦' : v}</div>)}</div><div className="vs-mark">✦</div><div className="hand-label">YOU {playing && <b>{cards.reduce((a, b) => a + b, 0)}</b>}</div><div className="playing-cards">{(cards.length ? cards : [10, 8]).map((v, i) => <div className="playing-card" key={`p-${i}`}>{v}</div>)}</div><span className="blackjack-suit">♠　♥　♣　♦</span></div>}
        {mode === 'Roulette' && <div className="roulette-stage"><div className="roulette-wheel"><div className="roulette-number">{lastResult.match(/landed on (\d+)/)?.[1] ?? '0'}</div><div className="roulette-center">✦</div></div><div className="roulette-bets"><span>0</span>{Array.from({ length: 12 }, (_, i) => <i className={i % 2 ? 'red-chip' : 'black-chip'} key={i}>{i + 1}</i>)}</div></div>}
        {mode === 'Dice' && <div className="dice-stage"><div className={`die ${round % 2 ? 'roll-die' : ''}`} key={round}>{lastResult.match(/rolled a (\d)/)?.[1] ?? '⚄'}</div><span className="dice-sparkle">✦</span><div className="dice-table-note">LUCKY ROLL</div></div>}
        {mode === 'Scratch' && <div className="scratch-stage"><div className="scratch-ticket"><div className="ticket-title">LUCKY SCRATCH <span>✦</span></div><div className="scratch-symbols">{slots.map((symbol, i) => <span key={`${round}-${i}`} className={scratch ? 'revealed' : ''}>{scratch ? symbol : '✦'}</span>)}</div><div className="ticket-caption">MATCH 2 OR MORE TO WIN</div></div></div>}
      </div>
      <div className="game-controls"><p className="game-instruction">{instructions[mode]}</p>
        {mode === 'Roulette' && <div className="choice-row"><span>Pick a color</span>{['red', 'black', 'green'].map((item) => <button key={item} onClick={() => setChoice(item)} className={`choice-chip ${item} ${choice === item ? 'chosen' : ''}`}>{item}</button>)}</div>}
        {mode === 'Dice' && <div className="choice-row"><span>Pick a side</span>{['over', 'under'].map((item) => <button key={item} onClick={() => setDiceTarget(item)} className={`choice-chip dice-choice ${diceTarget === item ? 'chosen' : ''}`}>{item === 'over' ? 'High · 4–6' : 'Low · 1–3'}</button>)}</div>}
        <div className="bet-row"><div className="bet-label"><span>BET</span><strong>✦ {money(bet)}</strong></div><div className="bet-options">{[10, 25, 50, 100].map((value) => <button key={value} className={bet === value ? 'bet-selected' : ''} onClick={() => setBet(value)}>+{value}</button>)}</div></div>
        {notice && <p className="modal-notice" role="status">{notice}</p>}
        {lastResult && <div className={`result-message ${lastResult.includes('win') || lastResult.includes('Jackpot') || lastResult.includes('matching') || lastResult.includes('Nice') ? 'result-win' : ''}`}>{lastResult}</div>}
        <button className="button button-primary play-round" onClick={mode === 'Slots' ? spin : mode === 'Roulette' ? roulette : mode === 'Dice' ? rollDice : mode === 'Scratch' ? scratchCard : blackjack}>{mode === 'Slots' ? 'Spin the reels' : mode === 'Blackjack' ? 'Deal cards' : mode === 'Roulette' ? 'Spin the wheel' : mode === 'Dice' ? 'Roll the dice' : 'Scratch & reveal'} <span>↗</span></button>
        <div className="modal-credit-row"><span>Balance <b>✦ {money(balance)} credits</b></span><button onClick={onRefill}>+ Free refill</button></div>
        <p className="demo-note">Demo credits only · No real money involved</p>
      </div>
    </section>
  </div>;
}

const cardValue = (card) => card === 1 ? 11 : Math.min(card, 10);
const cardTotal = (cards) => {
  let total = cards.reduce((sum, card) => sum + cardValue(card), 0);
  let aces = cards.filter((card) => card === 1).length;
  while (total > 21 && aces--) total -= 10;
  return total;
};
const formatCard = (card) => card === 1 ? 'A' : card === 11 ? 'J' : card === 12 ? 'Q' : card === 13 ? 'K' : card;

function ProfessionalGameModal({ game, balance, bet, setBet, onClose, onPlay, onRefill, notice, setNotice }) {
  const [reels, setReels] = useState(['🍒', '🍋', '🔔', '💎', '⭐']);
  const [roundText, setRoundText] = useState('');
  const [choice, setChoice] = useState('red');
  const [crashRunning, setCrashRunning] = useState(false);
  const [crashAt, setCrashAt] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [flightBusted, setFlightBusted] = useState(false);
  const [plinkoResult, setPlinkoResult] = useState(null);
  const [risk, setRisk] = useState('medium');
  const [mines, setMines] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [mineActive, setMineActive] = useState(false);
  const [towerFloor, setTowerFloor] = useState(0);
  const [towerActive, setTowerActive] = useState(false);
  const [kenoNumbers, setKenoNumbers] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [kenoDraw, setKenoDraw] = useState([]);
  const [wheelValue, setWheelValue] = useState(1);
  const [playerCards, setPlayerCards] = useState([]);
  const [bankerCards, setBankerCards] = useState([]);
  const [blackjackActive, setBlackjackActive] = useState(false);
  const [scratchSymbols, setScratchSymbols] = useState(['✦', '✦', '✦']);
  const [rouletteNumber, setRouletteNumber] = useState(0);
  const [roulettePick, setRoulettePick] = useState('red');
  const [baccaratPick, setBaccaratPick] = useState('player');
  const mode = game.mode;
  const crashProgress = flightBusted ? 1 : crashRunning || crashAt ? Math.max(0, Math.min(1, (multiplier - 1) / Math.max(crashAt - 1, .12))) : 0;
  const minesCount = 5;
  const towerChoices = 3;
  const plinkoTables = { low: [4, 2, 1.4, 1.1, 0.8, 1.1, 1.4, 2, 4], medium: [12, 4, 2, 1.2, 0.4, 1.2, 2, 4, 12], high: [40, 8, 3, 0.5, 0.2, 0.5, 3, 8, 40] };
  const winMessage = (text, payout) => {
    setRoundText(text);
    setNotice('');
    onPlay(text, payout);
  };
  const ensureBalance = () => {
    if (balance >= bet) return true;
    setNotice('Not enough demo credits. Add a free refill to keep playing!');
    return false;
  };
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => {
    if (!crashRunning) return undefined;
    const timer = window.setInterval(() => {
      const next = Number((multiplier + 0.03).toFixed(2));
      if (next >= crashAt) {
        window.clearInterval(timer);
        setCrashRunning(false);
        setFlightBusted(true);
        setMultiplier(crashAt);
        winMessage(`Flight ended at ${crashAt.toFixed(2)}×`, 0);
      } else setMultiplier(next);
    }, 100);
    return () => window.clearInterval(timer);
  }, [crashAt, crashRunning, multiplier]);
  function spinSlots() {
    if (!ensureBalance()) return;
    const icons = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🍀', '⭐'];
    const result = Array.from({ length: 5 }, () => pick(icons));
    setReels(result);
    const counts = result.reduce((all, icon) => ({ ...all, [icon]: (all[icon] || 0) + 1 }), {});
    const maxMatch = Math.max(...Object.values(counts));
    const payout = maxMatch >= 4 ? (maxMatch === 5 ? 15 : 5) : maxMatch === 3 ? 1.5 : 0;
    winMessage(maxMatch >= 3 ? `${maxMatch} matching symbols!` : 'No line hit — spin again', payout);
  }
  function spinRoulette() {
    if (!ensureBalance()) return;
    const result = Math.floor(Math.random() * 37);
    const color = result === 0 ? 'green' : rouletteRed.has(result) ? 'red' : 'black';
    setRouletteNumber(result);
    winMessage(`Ball: ${result} · ${color}${roulettePick === color ? ' · winning color!' : ''}`, roulettePick === color ? (color === 'green' ? 14 : 2) : 0);
  }
  function startCrash() {
    if (!ensureBalance()) return;
    setCrashAt(Number((1.12 + Math.random() * 5).toFixed(2)));
    setMultiplier(1);
    setFlightBusted(false);
    setRoundText('Flight in progress — cash out before it flies away!');
    setCrashRunning(true);
  }
  function cashOut() {
    if (!crashRunning) return;
    setCrashRunning(false);
    setFlightBusted(false);
    winMessage(`Cashed out at ${multiplier.toFixed(2)}×`, multiplier);
  }
  function dropPlinko() {
    if (!ensureBalance()) return;
    const slot = Array.from({ length: 8 }, () => Math.random() < 0.5 ? 1 : 0).reduce((sum, direction) => sum + direction, 0);
    const result = plinkoTables[risk][slot];
    setPlinkoResult({ slot, result });
    winMessage(`Ball landed in ${result}× slot`, result);
  }
  function resetMines() {
    setMines(Array.from({ length: 25 }, (_, index) => index).sort(() => Math.random() - 0.5).slice(0, minesCount));
    setRevealed([]);
    setMineActive(true);
    setRoundText('Pick a gem — cash out whenever you like.');
  }
  function pickMine(index) {
    if (!mineActive) {
      if (!ensureBalance()) return;
      resetMines();
    }
    if (revealed.includes(index)) return;
    const next = [...revealed, index];
    setRevealed(next);
    if (mines.includes(index)) {
      setMineActive(false);
      winMessage('Mine! Round over — try a fresh board.', 0);
    } else {
      setRoundText(`${next.length} safe gem${next.length === 1 ? '' : 's'} · cash out at ${(1.2 ** next.length).toFixed(2)}×`);
    }
  }
  function cashOutMines() {
    if (!mineActive || !revealed.length) return;
    setMineActive(false);
    winMessage(`Cashed out with ${revealed.length} gems`, 1.2 ** revealed.length);
  }
  function resetTower() {
    if (!ensureBalance()) return;
    setTowerFloor(0);
    setTowerActive(true);
    setRoundText('Choose a door to climb the tower.');
  }
  function climbTower(door) {
    if (!towerActive) return;
    const trap = Math.floor(Math.random() * towerChoices);
    if (door === trap) {
      setTowerActive(false);
      setTowerFloor(0);
      winMessage('Wrong door — the climb ends here.', 0);
    } else {
      setTowerFloor((floor) => floor + 1);
      setRoundText(`Clear floor ${towerFloor + 1} · cash out at ${(1.5 ** (towerFloor + 1)).toFixed(2)}×`);
    }
  }
  function cashOutTower() {
    if (!towerActive || towerFloor < 1) return;
    setTowerActive(false);
    winMessage(`Tower cleared: ${towerFloor} floor${towerFloor === 1 ? '' : 's'}`, 1.5 ** towerFloor);
  }
  function drawKeno() {
    if (!ensureBalance()) return;
    const drawn = Array.from({ length: 20 }, (_, index) => index + 1).sort(() => Math.random() - 0.5).slice(0, 10).sort((a, b) => a - b);
    const hits = kenoNumbers.filter((number) => drawn.includes(number)).length;
    setKenoDraw(drawn);
    const payouts = [0, 0, 0.2, 0.5, 1, 2, 5, 12, 30, 75, 250];
    winMessage(`${hits} of your numbers drawn`, payouts[hits] ?? 0);
  }
  function spinWheel() {
    if (!ensureBalance()) return;
    const values = [0, 0, 0.2, 0.5, 1, 1.5, 2, 3, 5, 10];
    const value = pick(values);
    setWheelValue(value);
    winMessage(value ? `Wheel landed on ${value}×` : 'No prize this spin', value);
  }
  function startBlackjack() {
    if (!ensureBalance()) return;
    const deal = () => Math.floor(Math.random() * 13) + 1;
    const player = [deal(), deal()];
    const dealer = [deal(), deal()];
    setPlayerCards(player);
    setBankerCards(dealer);
    setBlackjackActive(true);
    setRoundText('Hit for another card or stand to settle.');
    if (cardTotal(player) === 21) settleBlackjack(player, dealer);
  }
  function settleBlackjack(player, dealer) {
    const playerTotal = cardTotal(player), dealerTotal = cardTotal(dealer);
    const payout = playerTotal > 21 ? 0 : dealerTotal > 21 || playerTotal > dealerTotal ? 2 : playerTotal === dealerTotal ? 1 : 0;
    setBlackjackActive(false);
    winMessage(`You ${playerTotal} · Dealer ${dealerTotal} · ${payout === 2 ? 'you win' : payout === 1 ? 'push' : 'dealer wins'}`, payout);
  }
  function hitBlackjack() {
    const next = [...playerCards, Math.floor(Math.random() * 13) + 1];
    setPlayerCards(next);
    if (cardTotal(next) >= 21) settleBlackjack(next, bankerCards);
  }
  function standBlackjack() {
    let house = [...bankerCards];
    while (cardTotal(house) < 17) house = [...house, Math.floor(Math.random() * 13) + 1];
    setBankerCards(house);
    settleBlackjack(playerCards, house);
  }
  function playBaccarat() {
    if (!ensureBalance()) return;
    const draw = () => Math.floor(Math.random() * 13) + 1;
    const value = (card) => card === 1 ? 1 : card >= 10 ? 0 : card;
    let player = [draw(), draw()];
    let banker = [draw(), draw()];
    let p = player.reduce((sum, card) => sum + value(card), 0) % 10;
    let b = banker.reduce((sum, card) => sum + value(card), 0) % 10;
    let playerThird = null;
    if (p < 8 && b < 8 && p <= 5) {
      playerThird = draw();
      player = [...player, playerThird];
      p = (p + value(playerThird)) % 10;
    }
    const bankerDraws = !playerThird ? b <= 5 : b <= 2 || (b === 3 && value(playerThird) !== 8) || (b === 4 && value(playerThird) >= 2 && value(playerThird) <= 7) || (b === 5 && value(playerThird) >= 4 && value(playerThird) <= 7) || (b === 6 && [6, 7].includes(value(playerThird)));
    if (p < 8 && b < 8 && bankerDraws) {
      banker = [...banker, draw()];
      b = banker.reduce((sum, card) => sum + value(card), 0) % 10;
    }
    setPlayerCards(player);
    setBankerCards(banker);
    const winner = p === b ? 'tie' : p > b ? 'player' : 'banker';
    const payout = winner === baccaratPick ? winner === 'tie' ? 8 : winner === 'banker' ? 1.95 : 2 : 0;
    winMessage(`Player ${p} · Banker ${b} · ${winner} wins`, payout);
  }
  function scratchTicket() {
    if (!ensureBalance()) return;
    const result = Array.from({ length: 9 }, () => pick(['💎', '🍀', '⭐', '🎁', '💰', '🌙']));
    setScratchSymbols(result);
    const counts = result.reduce((all, symbol) => ({ ...all, [symbol]: (all[symbol] || 0) + 1 }), {});
    const most = Math.max(...Object.values(counts));
    winMessage(most >= 4 ? `${most} matching symbols — grand reveal!` : most === 3 ? 'Three matching symbols!' : 'No match on this ticket', most >= 5 ? 10 : most === 4 ? 3 : most === 3 ? 1.5 : 0);
  }
  function toggleKeno(number) {
    setKenoNumbers((selected) => selected.includes(number) ? selected.filter((item) => item !== number) : selected.length < 10 ? [...selected, number] : selected);
  }
  const modalInstructions = { Slots: 'Find 3 or more matching symbols anywhere on the reels.', Blackjack: 'Reach 21 without going over. Aces count as 1 or 11.', Roulette: 'Choose a color. Green zero pays a higher demo multiplier.', Crash: 'Watch the flight multiplier and cash out before the crash.', Plinko: 'Drop a ball through the pegs. Choose your risk level.', Mines: 'Find gems, avoid hidden mines, and cash out when ready.', Tower: 'Pick a safe door on each floor; multipliers climb as you go.', Keno: 'Select up to 10 lucky numbers, then draw 10 from 40.', Wheel: 'Spin the prize wheel for a demo-credit multiplier.', Baccarat: 'Pick Player, Banker, or Tie before comparing hands.', Scratch: 'Reveal nine symbols and match three or more.' };
  const actionText = { Slots: 'SPIN REELS', Blackjack: 'DEAL CARDS', Roulette: 'SPIN ROULETTE', Crash: crashRunning ? `CASH OUT · ${multiplier.toFixed(2)}×` : flightBusted ? 'FLIGHT ENDED · PLAY AGAIN' : 'LAUNCH FLIGHT', Plinko: 'DROP THE BALL', Mines: mineActive ? 'CASH OUT' : 'START NEW ROUND', Tower: towerActive ? 'CASH OUT' : 'START CLIMB', Keno: 'DRAW NUMBERS', Wheel: 'SPIN THE WHEEL', Baccarat: 'DEAL BACCARAT', Scratch: 'REVEAL TICKET' };
  function primaryAction() {
    if (mode === 'Slots') return spinSlots();
    if (mode === 'Roulette') return spinRoulette();
    if (mode === 'Crash') return crashRunning ? cashOut() : startCrash();
    if (mode === 'Plinko') return dropPlinko();
    if (mode === 'Mines') return mineActive ? cashOutMines() : resetMines();
    if (mode === 'Tower') return towerActive ? cashOutTower() : resetTower();
    if (mode === 'Keno') return drawKeno();
    if (mode === 'Wheel') return spinWheel();
    if (mode === 'Blackjack') return startBlackjack();
    if (mode === 'Baccarat') return playBaccarat();
    return scratchTicket();
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`game-modal pro-game-modal game-${mode.toLowerCase()}`} role="dialog" aria-modal="true" aria-label={`${game.title} demo game`}>
      <header className="modal-header"><div className="modal-title"><GameLogo game={game} compact /><div><h2>{game.title}</h2><p>{modes[mode]} <span>·</span> LuckyLane Originals</p></div></div><button className="close-button" onClick={onClose} aria-label="Close game">×</button></header>
      <div className={`pro-table pro-table-${mode.toLowerCase()}`}>
        {mode === 'Slots' && <div className="pro-slot"><div className="pro-slot-heading">{game.title.split(':')[1]?.trim().toUpperCase()} <span>★ BONUS REELS</span></div><div className="pro-reels">{reels.map((symbol, index) => <div key={`${index}-${symbol}`} className="pro-reel">{symbol}</div>)}</div><div className="pro-payline">5 REELS · MATCH 3+ ANYWHERE</div></div>}
        {mode === 'Blackjack' && <div className="card-table"><div className="card-hand"><span>DEALER <b>{bankerCards.length ? cardTotal(bankerCards) : '—'}</b></span><div>{(bankerCards.length ? bankerCards : [12, 1]).map((card, index) => <i className={`poker-card ${!bankerCards.length && index === 1 ? 'face-down' : ''}`} key={index}>{bankerCards.length ? formatCard(card) : index ? '✦' : 'Q'}<small>♠</small></i>)}</div></div><div className="table-center-mark">♠　21　♣</div><div className="card-hand"><span>YOUR HAND <b>{playerCards.length ? cardTotal(playerCards) : '—'}</b></span><div>{(playerCards.length ? playerCards : [8, 6]).map((card, index) => <i className="poker-card" key={index}>{playerCards.length ? formatCard(card) : card}<small>{index % 2 ? '♦' : '♥'}</small></i>)}</div></div></div>}
        {mode === 'Roulette' && <div className="pro-roulette"><div className="roulette-dial"><div className="dial-core"><b>{rouletteNumber}</b><small>{rouletteNumber === 0 ? 'GREEN' : rouletteRed.has(rouletteNumber) ? 'RED' : 'BLACK'}</small></div></div><div className="roulette-number-grid"><button className="green-cell" onClick={() => setRoulettePick('green')}>0</button>{Array.from({ length: 36 }, (_, index) => index + 1).map((number) => <button key={number} className={`${rouletteRed.has(number) ? 'red-cell' : 'black-cell'} ${roulettePick === (rouletteRed.has(number) ? 'red' : 'black') ? 'cell-active' : ''}`} onClick={() => setRoulettePick(rouletteRed.has(number) ? 'red' : 'black')}>{number}</button>)}</div><div className="roulette-colors">{['red', 'black', 'green'].map((color) => <button className={`choice-chip ${color} ${roulettePick === color ? 'chosen' : ''}`} onClick={() => setRoulettePick(color)} key={color}>{color}</button>)}</div></div>}
        {mode === 'Crash' && <div className={`crash-scene ${crashRunning ? 'in-flight' : ''} ${flightBusted ? 'busted' : ''}`} style={{ '--flight-x': `${12 + crashProgress * 70}%`, '--flight-y': `${14 + crashProgress * 45}%` }}>
          <div className="crash-grid" />
          <div className="crash-stars"><i>✦</i><i>✧</i><i>·</i><i>✦</i></div>
          <div className="crash-topline"><span><i className="flight-live-dot" /> LUCKY LANE FLIGHT</span><b>{flightBusted ? 'FLIGHT ENDED' : crashRunning ? '● LIVE DEMO' : 'READY FOR TAKEOFF'}</b></div>
          <div className="crash-graph-area"><svg className="crash-graph" viewBox="0 0 520 280" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="crashFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#65e7d0" stopOpacity=".3" /><stop offset="1" stopColor="#65e7d0" stopOpacity="0" /></linearGradient></defs>
            <defs><clipPath id="crashReveal" clipPathUnits="userSpaceOnUse"><rect width={520 * crashProgress} height="280" /></clipPath></defs>
            <path className="crash-graph-fill" clipPath="url(#crashReveal)" d="M0 266 C84 260 107 239 174 226 S264 182 318 162 S398 92 520 27 V280 H0Z" />
            <path className="crash-graph-line" pathLength="100" style={{ strokeDashoffset: 100 * (1 - crashProgress) }} d="M0 266 C84 260 107 239 174 226 S264 182 318 162 S398 92 520 27" />
          </svg></div>
          <div className="crash-center-readout"><span>DEMO MULTIPLIER</span><strong className="crash-multiplier">{flightBusted ? 'CRASHED' : `${multiplier.toFixed(2)}×`}</strong><small>{flightBusted ? 'FLIGHT COMPLETE' : crashRunning ? 'CASH OUT ANY TIME' : 'START A NEW FLIGHT'}</small></div>
          <div className="flight-rocket" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M43 5C29 6 16 13 8 24l9 1 1 10C29 27 38 16 43 5Z" /><path d="m12 27-6 7 11 1M19 36l-1 7 8-7" /><circle cx="31" cy="16" r="3" /></svg></div>
          <div className="crash-cityline" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="crash-hud"><span><small>DEMO WAGER</small><b>✦ {money(bet)}</b></span><span><small>FLIGHT STATUS</small><b>{flightBusted ? 'ENDED' : crashRunning ? 'IN PROGRESS' : 'STANDBY'}</b></span></div>
        </div>}
        {mode === 'Plinko' && <div className="plinko-scene"><div className="plinko-heading">DROP ZONE <span>· {risk.toUpperCase()} RISK</span></div><div className="plinko-pegboard">{Array.from({ length: 8 }, (_, row) => <div className="peg-row" key={row}>{Array.from({ length: row + 3 }, (_, peg) => <i key={peg} />)}</div>)}</div><div className="plinko-bins">{plinkoTables[risk].map((value, index) => <span className={plinkoResult?.slot === index ? 'bin-hit' : ''} key={index}>{value}×</span>)}</div></div>}
        {mode === 'Mines' && <div className="mines-scene"><div className="mines-hud"><span>💣 {minesCount} MINES</span><b>💎 {revealed.filter((index) => !mines.includes(index)).length} SAFE</b><span>🏆 {mineActive && revealed.length ? `${(1.2 ** revealed.length).toFixed(2)}×` : '—'}</span></div><div className="mine-grid">{Array.from({ length: 25 }, (_, index) => <button key={index} className={`${revealed.includes(index) ? mines.includes(index) ? 'mine-hit' : 'gem-hit' : ''}`} onClick={() => pickMine(index)} aria-label={`Tile ${index + 1}`}>{revealed.includes(index) ? mines.includes(index) ? '💣' : '💎' : '✦'}</button>)}</div></div>}
        {mode === 'Tower' && <div className="tower-scene"><div className="tower-lights">✦　　✧　　✦</div><div className="tower-stack">{Array.from({ length: 5 }, (_, index) => <div className={`tower-floor ${index < towerFloor ? 'floor-cleared' : ''}`} key={index}><span>FLOOR {5 - index}</span><b>{index < towerFloor ? '✓' : '◇'}</b></div>)}</div><div className="tower-door-label">{towerActive ? `CHOOSE A DOOR · FLOOR ${towerFloor + 1}` : 'CLIMB FOR A BIGGER MULTIPLIER'}</div><div className="tower-doors">{Array.from({ length: towerChoices }, (_, index) => <button onClick={() => climbTower(index)} disabled={!towerActive} key={index}>♙<small>DOOR {index + 1}</small></button>)}</div></div>}
        {mode === 'Keno' && <div className="keno-scene"><div className="keno-heading"><span>YOUR LUCKY PICKS</span><b>{kenoNumbers.length} / 10</b></div><div className="keno-grid">{Array.from({ length: 40 }, (_, index) => index + 1).map((number) => <button key={number} className={`${kenoNumbers.includes(number) ? 'keno-selected' : ''} ${kenoDraw.includes(number) ? 'keno-drawn' : ''}`} onClick={() => toggleKeno(number)}>{number}</button>)}</div><div className="keno-draw-note">{kenoDraw.length ? `DRAWN: ${kenoDraw.join(' · ')}` : 'PICK UP TO 10 NUMBERS'}</div></div>}
        {mode === 'Wheel' && <div className="prize-wheel"><span className="wheel-pointer">▼</span><div className="wheel-disc"><div className="wheel-value">{wheelValue}×</div></div><span className="wheel-hub">✦</span><div className="wheel-rim-label">LUCKY LANE · PRIZE WHEEL ·</div></div>}
        {mode === 'Baccarat' && <div className="baccarat-table"><div className="baccarat-brand">BACCARAT <span>·</span> TABLE 01</div><div className="baccarat-hands"><div><label>PLAYER</label><strong>{playerCards.length ? playerCards.reduce((sum, value) => sum + value, 0) % 10 : '—'}</strong><div className="baccarat-cards">{(playerCards.length ? playerCards : [7, 2]).map((card, index) => <i className="poker-card" key={index}>{playerCards.length ? card : '·'}<small>♥</small></i>)}</div></div><span className="baccarat-vs">VS</span><div><label>BANKER</label><strong>{bankerCards.length ? bankerCards.reduce((sum, value) => sum + value, 0) % 10 : '—'}</strong><div className="baccarat-cards">{(bankerCards.length ? bankerCards : [4, 8]).map((card, index) => <i className="poker-card" key={index}>{bankerCards.length ? card : '·'}<small>♠</small></i>)}</div></div></div><div className="baccarat-bets">{['player', 'tie', 'banker'].map((item) => <button key={item} onClick={() => setBaccaratPick(item)} className={baccaratPick === item ? 'chosen' : ''}>{item.toUpperCase()}<small>{item === 'tie' ? '8:1' : item === 'banker' ? '0.95:1' : '1:1'}</small></button>)}</div></div>}
        {mode === 'Scratch' && <div className="scratch-pro"><div className="scratch-ticket-head"><span>LUCKY LANE</span><b>GOLDEN REVEAL</b><span>✦ ✦ ✦</span></div><div className="scratch-pro-grid">{scratchSymbols.map((symbol, index) => <div className="scratch-pro-cell" key={`${index}-${symbol}`}>{symbol}</div>)}</div><div className="scratch-ticket-foot">MATCH THREE OR MORE TO WIN</div></div>}
      </div>
      <div className="pro-controls"><p className="game-instruction">{modalInstructions[mode]}</p>
        {mode === 'Plinko' && <div className="pro-option-row"><span>RISK</span>{['low', 'medium', 'high'].map((item) => <button className={risk === item ? 'option-active' : ''} onClick={() => setRisk(item)} key={item}>{item}</button>)}</div>}
        {mode === 'Blackjack' && blackjackActive && <div className="blackjack-actions"><button onClick={hitBlackjack}>Hit</button><button onClick={standBlackjack}>Stand</button></div>}
        <div className="bet-row"><div className="bet-label"><span>DEMO BET</span><strong>✦ {money(bet)}</strong></div><div className="bet-options">{[10, 25, 50, 100].map((value) => <button key={value} className={bet === value ? 'bet-selected' : ''} onClick={() => setBet(value)}>+{value}</button>)}</div></div>
        {notice && <p className="modal-notice" role="status">{notice}</p>}
        {roundText && <div className={`result-message ${roundText.includes('win') || roundText.includes('matching') || roundText.includes('Cashed') || roundText.includes('landed') ? 'result-win' : ''}`} role="status">{roundText}</div>}
        {mode !== 'Blackjack' || !blackjackActive ? <button className={`button button-primary play-round pro-play-round ${mode === 'Crash' && crashRunning ? 'cash-out-button' : ''}`} onClick={primaryAction} disabled={(mode === 'Blackjack' && blackjackActive) || (mode === 'Mines' && mineActive && !revealed.length) || (mode === 'Tower' && towerActive && !towerFloor)}>{actionText[mode]} <span>↗</span></button> : null}
        <div className="modal-credit-row"><span>Demo balance <b>✦ {money(balance)} credits</b></span><button onClick={onRefill}>+ Free refill</button></div>
        <p className="demo-note">Demo credits only · No real money · LuckyLane Originals</p>
      </div>
    </section>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
