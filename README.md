# LuckyLane

A mobile-responsive social casino arcade demo built with React and Vite. It includes 120 playable LuckyLane originals across 12 formats: slots, blackjack, European roulette, crash, Plinko, mines, tower, Keno, prize wheel, baccarat, and scratch cards. Demo sign-up and login profiles are stored locally in the browser.

## Run locally

Install dependencies with `npm install`, then start the dev server using `npm run dev`. Create a production build with `npm run build`.

## Demo-only experience

LuckyLane uses fictional demo credits only. Credits have no cash value and cannot be purchased, transferred, or redeemed. Game outcomes are local simulations; no payment, gambling, authentication, or game-provider services are connected. Demo profiles are not secure production accounts; do not reuse real passwords. Use the **Add credits** button to refill the play balance.

## Referenced services

- **RapidAPI / Nokia API Hub** is a marketplace, not one game API. A particular published API, its terms, and its own key are required before it can be integrated.
- **Slotopol server** is an MIT-licensed, self-hosted game simulation server. Its repository describes 353 slot simulations, but it is a separate Go backend, not an official publisher client or a bundle of licensed publisher artwork. It has not been installed or connected in this front-end. A deployment needs a running server, a reviewed server/API setup, and a client adapter; preserve its MIT copyright notice if you redistribute its code.
- **The Odds API** provides sports fixture/odds data, not playable casino games. Its API requires a subscription key. It is not connected here, and this demo does not add sports wagering.

LuckyLane instead shows 120 playable original demo games in casino-style collections (Popular, New releases, Jackpot, and Exclusive) and game-type filters. It does not imply affiliation with the named gaming providers or reproduce their assets. For official third-party games, integrate through the provider's authorized launch API and licensed assets; for Slotopol simulations, deploy and configure that service separately first.

## Free & open-source backend engines

- **[Slotopol Server (GitHub)](https://github.com/slotopol/server)**: A free Golang-based slots server with a full HTTP REST API for spinning logic, double-up math, and account handling. It simulates reels and lets you configure RTP values for modular server-side game logic.
- **[Slot-Engine ecosystem (GitHub)](https://github.com/slot-engine/slot-engine)**: A collection of TypeScript libraries for simulating and configuring slot games, including web-based testing tools and lookup-table optimization for balancing payout odds.
- **[Goldsvet open-source engine (GitHub)](https://github.com/topics/goldsvet)**: A PHP-based self-hosted slots platform often used by web3 and crypto-focused game developers for local standalone casino builds.

## Frontend & UI construction

- **[Slots-JS Canvas Engine (GitHub)](https://github.com/HorrellTech/slots-js)**: A standalone JavaScript and HTML5 Canvas engine for customizable slot layouts, multi-line betting paths, and symbol multipliers entirely in the browser.
- **Phaser.js** via the [Sologe iGaming guide](https://sologe.net/blog/igaming/free-igaming-software/): A popular open-source framework for building modern browser-based slot machine experiences with rich graphics and animation.
- **Vanilla JS & Web Animations API**: Community projects such as native CSS/JavaScript slot machine demos can provide smooth reel motion and responsive mobile behavior without a heavy framework.
# luckylane
