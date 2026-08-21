# PalaRivals Watch

PalaRivals Watch is a browser-based autobattler featuring characters inspired by Marvel Rivals, Overwatch, and Paladins.

Created by Robert, Nick, and Azzy.

## Community suggestion storage

The main menu suggestion terminal posts feedback to `/api/suggestions`. Submitted ideas are stored as one private JSON document at `community/suggestions.json` in Vercel Blob. If the API or storage is unavailable, the browser keeps up to 50 suggestions in a local queue and retries them when the terminal is opened again.

To enable the shared JSON channel on Vercel:

1. Open the deployed project in Vercel and select **Storage**.
2. Create a **private Blob** store and connect it to this project. New connections use Vercel OIDC (`VERCEL_OIDC_TOKEN` and `BLOB_STORE_ID`); older connections may supply `BLOB_READ_WRITE_TOKEN`. The API supports both.
3. Add a long random `SUGGESTIONS_ADMIN_KEY` environment variable to Production, Preview, and Development as needed.
4. Redeploy the project.

To download the private JSON through the API, send an authenticated `GET /api/suggestions` request with this header:

```text
Authorization: Bearer YOUR_SUGGESTIONS_ADMIN_KEY
```

To review and delete suggestions in the browser, open `/admin/suggestions` on the deployed site and enter the same admin key. The key is kept in memory for that page only and is not stored by the site.

Never put either secret in browser JavaScript or commit a populated `.env` file. `.env.example` documents the required variable names.

## Fan project notice

This is a fan-made project. Characters and related properties belong to NetEase Games, Blizzard Entertainment, and Hi-Rez Studios.
