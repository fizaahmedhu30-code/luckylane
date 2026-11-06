# LuckyLane

A mobile-responsive social casino arcade demo built with React and Vite. The homepage includes the 353 titles documented by Slotopol across 11 providers, with provider, reel format, and game mechanic metadata. It also includes 320 locally simulated LuckyLane entries across 12 formats. Slotopol titles are played by calling a configured server.

## Run locally

Install dependencies with `npm install`, then start the dev server using `npm run dev`. Create a production build with `npm run build`.

## Slotopol catalog and play

The homepage can browse the bundled upstream catalog without a running server. To run the official engine locally, clone `https://github.com/slotopol/server`, install Go and a C toolchain with libc development headers (for example `build-essential` and `libc6-dev` on Debian/Ubuntu), then run `go run . web` in the server repository. On a fresh database the server seeds a virtual club and demo accounts. The seeded dealer is `dealer@example.org` with password `LtpkAr`; use club ID `1`. These published credentials are for a local demo only and must never be exposed on an internet-facing server.

Set `SLOTOPOL_API_URL=http://localhost:8080` in the LuckyLane environment (see `.env.example`) and restart Vite. First sign in to a local LuckyLane demo account, then connect to the Slotopol server using its own account. The app reads `/game/algs`, creates each selected title with its exact provider/name alias through `/game/new`, and sends slot spins to `/slot/spin` or Keno draws to `/keno/spin`. The server's game rules produce the grid, wins, and separate server wallet; LuckyLane's local demo credit balance is not used for Slotopol games.

The upstream catalog is server-build dependent. The server must include the games you want, expose its API to the Vite proxy, and have a club/user with dealer or admin access and funds configured. The frontend does not copy upstream game engines or publisher artwork. Slotopol outcomes and wallet are managed by that server; LuckyLane's free refill and local demo balance apply only to LuckyLane originals.

## Demo-only experience

LuckyLane originals use fictional demo credits only. Credits have no cash value and cannot be purchased, transferred, or redeemed. Their outcomes are local simulations. Demo profiles are stored in this browser and are not secure production accounts; do not reuse real passwords. Use **Add credits** to refill the local demo balance. Slotopol is an optional self-hosted simulation service and uses its own account, wallet, and server-side outcomes.

## Referenced services

- **RapidAPI / Nokia API Hub** is a marketplace, not one game API. A particular published API, its terms, and its own key are required before it can be integrated.
- **Slotopol server** is an MIT-licensed, self-hosted game simulation server. Its repository documents 353 simulations across 11 providers, but it is a separate Go backend, not an official publisher client or a bundle of licensed publisher artwork. This frontend integrates its catalog and spin APIs when a server is configured; preserve its MIT copyright notice if you redistribute its code.
- **The Odds API** provides sports fixture/odds data, not playable casino games. Its API requires a subscription key. It is not connected here, and this demo does not add sports wagering.

LuckyLane shows its 353-title Slotopol catalog with provider filters and 320 local demo entries as a separate collection. Connected Slotopol cards launch their matching server simulations; without a server session they cannot be played. It does not imply affiliation with named gaming providers or reproduce their assets; Slotopol logos are original generated monograms. For official third-party games, integrate through the provider's authorized launch API and licensed assets.

## Free & open-source backend engines

- **[Slotopol Server (GitHub)](https://github.com/slotopol/server)**: A free Golang-based slots server with a full HTTP REST API for spinning logic, double-up math, and account handling. It simulates reels and lets you configure RTP values for modular server-side game logic.
- **[Slot-Engine ecosystem (GitHub)](https://github.com/slot-engine/slot-engine)**: A collection of TypeScript libraries for simulating and configuring slot games, including web-based testing tools and lookup-table optimization for balancing payout odds.
- **[Goldsvet open-source engine (GitHub)](https://github.com/topics/goldsvet)**: A PHP-based self-hosted slots platform often used by web3 and crypto-focused game developers for local standalone casino builds.

## Frontend & UI construction

- **[Slots-JS Canvas Engine (GitHub)](https://github.com/HorrellTech/slots-js)**: A standalone JavaScript and HTML5 Canvas engine for customizable slot layouts, multi-line betting paths, and symbol multipliers entirely in the browser.
- **Phaser.js** via the [Sologe iGaming guide](https://sologe.net/blog/igaming/free-igaming-software/): A popular open-source framework for building modern browser-based slot machine experiences with rich graphics and animation.
- **Vanilla JS & Web Animations API**: Community projects such as native CSS/JavaScript slot machine demos can provide smooth reel motion and responsive mobile behavior without a heavy framework.
# luckylane
