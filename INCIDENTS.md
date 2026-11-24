# Posting an incident

Edit `incidents.json` and push to `main`; the page shows it within a minute of deploy.
An incident stays on its services (with its updates) until its `status` is `resolved`.

```json
{
  "incidents": [
    {
      "id": "2026-11-24-id-sign-in",
      "title": "Sign-in is failing",
      "services": ["id", "admin"],
      "status": "investigating",
      "updates": [
        { "time": "2026-11-24T09:05:00Z", "text": "We are investigating failed sign-ins." },
        { "time": "2026-11-24T09:40:00Z", "text": "Cause found; a fix is being deployed." }
      ]
    }
  ]
}
```

- `services`: any of `id`, `admin`, `utilities`, `website`.
- `status`: `investigating`, `identified`, `monitoring` or `resolved`. Add a final update with the resolution time when resolving.
- Plain text only. Keep it free of personal data.
