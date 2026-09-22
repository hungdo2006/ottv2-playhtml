# OTT v2 - Rock Paper Scissors Board Game

A complete static web project for the OTT v2 assignment. The game supports:

- Local 2-player pass-and-play mode.
- Online real-time multiplayer powered by `playhtml`.
- 9x9 board.
- One-square movement in all 8 directions, like a chess king.
- Rock > Scissors, Scissors > Paper, Paper > Rock capture rules.
- Same-type pieces block each other and cannot capture.
- Spectators in online rooms.
- Automatic P1/P2 seat cleanup when a player disconnects.
- Score, rounds, last move, legal-move highlighting and responsive UI.
- Win by eliminating all enemy pieces of any one type.
- Win by reaching the target corner: P1 -> `i9`, P2 -> `a1`.

## Assignment mapping

### Exercise 1 - OTT v2 for two players

Open the site and choose **Local 2-player**. Both players use the same device and alternate turns.

### Exercise 2 - multiplayer with playhtml

Choose **Create online room**, share the generated room code/link, then let one browser claim P1 and another claim P2. Additional visitors remain spectators.

The online board state uses playhtml Page Data. Online users and seat cleanup use playhtml Presence.

Official playhtml documentation:

- https://playhtml.fun/docs/
- https://playhtml.fun/docs/reference/playhtml-client/
- https://playhtml.fun/docs/data/presence/

## Important rule assumption

The assignment text defines the board size, movement, capture cycle and win conditions, but does not specify the exact starting formation or number of pieces.

This repository uses a configurable symmetric default:

- 9 pieces per player.
- 3 Rock, 3 Paper and 3 Scissors per player.
- `a1` and `i9` are empty at the start.
- P1 starts at the bottom and targets `i9`.
- P2 starts at the top and targets `a1`.

If the lecturer gives a different formation, edit only `createInitialBoard()` in `js/state.js`. The rest of the game logic does not need to change.

## Project structure

```text
ottv2-playhtml/
|-- index.html
|-- game.html
|-- css/
|   `-- style.css
|-- js/
|   |-- constants.js
|   |-- home.js
|   |-- local.js
|   |-- main.js
|   |-- multiplayer.js
|   |-- rules.js
|   |-- state.js
|   `-- ui.js
|-- tests/
|   `-- rules.test.js
|-- package.json
|-- LICENSE
`-- README.md
```

## Run locally

Because the project uses JavaScript modules, serve it over HTTP instead of opening `index.html` with a `file://` URL.

### Option A - VS Code Live Server

1. Open this folder in VS Code.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html`.
4. Choose **Open with Live Server**.

### Option B - Python

From the project folder:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

Online mode requires internet access because the playhtml client is loaded from `https://unpkg.com/playhtml` and connects to playhtml's sync service.

## Tests

The game-rule tests use only Node's built-in test runner; there are no npm dependencies.

```bash
npm test
npm run check
```

## GitHub setup

Create an empty GitHub repository, then from this project folder run:

```bash
git init
git add .
git commit -m "feat: complete OTT v2 local and multiplayer game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

## Deploy with GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings -> Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch `main` and folder `/ (root)`.
5. Save.
6. Open the Pages URL after deployment finishes.

No server build is required. The site is fully static; playhtml supplies the multiplayer synchronization service.

## Suggested 4-person team split

| Member | Main responsibility |
| --- | --- |
| Student 1 | Board/state engine and movement |
| Student 2 | RPS capture and win-condition rules |
| Student 3 | UI, responsive layout and interactions |
| Student 4 | playhtml rooms, presence, Git/GitHub Pages |

Everyone should still understand the shared functions in `rules.js` and `state.js` for the presentation/demo.

## Key files to explain during presentation

- `js/rules.js`: all game rules and validation.
- `js/state.js`: starting formation and match state.
- `js/multiplayer.js`: playhtml Page Data + Presence integration.
- `js/main.js`: connects user clicks to local/online controllers.
- `js/ui.js`: renders the 9x9 board and match information.

## Security / data note

Do not put passwords, private information or secrets into the room state. The current playhtml public service is intended for shared collaborative state, and room participants should be treated as untrusted clients.

## License

MIT for this student project. See `LICENSE`.
