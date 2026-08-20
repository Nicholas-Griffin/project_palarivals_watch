# PalaRivals Watch

PalaRivals Watch is a browser-based autobattler featuring characters inspired by Marvel Rivals, Overwatch, and Paladins.

Created by Robert, Nick, and Azzy.

## Vercel deployment

This repository is ready to deploy as a static Vercel project. It does not require npm packages, a build command, environment variables, or an output folder.

1. Push the latest version of the `main` branch to GitHub.
2. In Vercel, select **Add New → Project**.
3. Import the `project_palarivals_watch` GitHub repository.
4. Use these project settings:
   - **Framework Preset:** Other
   - **Root Directory:** `.`
   - **Build Command:** Leave empty
   - **Output Directory:** Leave empty
   - **Install Command:** Leave empty
5. Select **Deploy**.

The included `vercel.json` configuration provides these routes:

- `/` — Main menu
- `/play` — Game lobby
- `/profile` — Player profile

The original `.html` addresses remain available, so existing navigation continues to work.

## Current scope

The deployed game is client-side and plays against AI opponents. Online multiplayer, real accounts, and persistent cloud saves are not part of this deployment setup yet.

## Fan project notice

This is a fan-made project. Characters and related properties belong to NetEase Games, Blizzard Entertainment, and Hi-Rez Studios.
