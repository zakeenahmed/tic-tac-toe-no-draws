# Sliding tic-tac-toe (no draws)

A two-player, browser-only tic-tac-toe variant. After each player has three marks, pieces slide one step orthogonally. A game cannot draw and cannot run forever.

Rules: [docs/RULES.md](docs/RULES.md)  
Design notes: [docs/DESIGN.md](docs/DESIGN.md)

## Run

No build step. From this directory:

```
python -m http.server
```

Open http://127.0.0.1:8000/ in current Chrome. Human vs human is enough; there is no computer opponent.

## Transcript

Session records and the candidate brief live under [transcript/](transcript/).
