# Metallic Bonding Interactive Lab

A small, self-contained web lab to help GCSE Chemistry students visualise metallic bonding and how it explains the properties of metals.

## Scenes

1. **Metallic bonding** – positive metal ions in a giant lattice with delocalised electrons moving freely between them.
2. **Hammering / malleability** – a sheet of metal on an anvil being hit with a hammer, showing layers of ions sliding but the metallic bonding holding the structure together.
3. **Wire & current** – a metal wire containing ions and delocalised electrons, with a battery that can be switched on to show electrons drifting to form an electric current.

## How to run locally

From the project folder:

```bash
cd "metallicbonding"
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

No build tools or dependencies are required – it is plain HTML, CSS, and JavaScript.
