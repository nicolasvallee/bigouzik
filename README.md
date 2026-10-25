# Bigouzik

## Analytics

Production tracking is configured in `.env.production` and is included automatically
in GitHub Pages builds. No GitHub repository variables are required.

- `VITE_UMAMI_WEBSITE_ID`: the website ID from Umami's tracking snippet.
- `VITE_UMAMI_SCRIPT_URL`: the snippet's script URL (defaults to `https://cloud.umami.is/script.js`).

Redeploy after changing these values. They are public tracking configuration, not API keys.
For a local production preview, run `pnpm build` and `pnpm preview`; this sends real analytics.
Development mode does not load analytics. To disable tracking in a local production preview,
set `VITE_UMAMI_WEBSITE_ID=` in `.env.local`. `.env.example` lists the available settings.

Umami automatically tracks page visits and Vue Router navigation. Filter Pages by
`/bigouzik/tuto` to see tutorial visits, including direct links.

Custom events appear under Events; use Properties to see the breakdowns:

| Event | Properties | Meaning |
| --- | --- | --- |
| `track_play` | `track`, `title`, `speed`, `instrument` | First confirmed playback per mounted player. Pauses, resumes and loops do not add plays; returning to a group/page mounts a new player and can add another play. |
| `view_toggle` | `group`, `view`, `enabled` | Partoches (`sheet`) or Cercles (`circle`) turned on/off. |
| `speed_change` | `group`, `speed` | User selects a playback speed, e.g. `0.8`. |
| `instrument_change` | `group`, `instrument` | User changes to Tout (`both`), Caisse (`snare`) or Surdo (`kick`). |

Speed and instrument changes apply to the whole group. Automatic resets when
switching groups do not count as user changes. Tutorial example playback is also tracked;
filter events by page URL to distinguish it from the main player pages.

To verify after deployment, visit Tuto, play a track, pause/resume, toggle both views,
and change speed/instrument. Check Umami's realtime view and Events for the matching
page visits and events. Browser blockers may prevent collection.
