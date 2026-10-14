<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Financial AI runs through authenticated server functions with request-local gateway clients; no prompts or private credentials enter browser code.
- Assistant proposals are reviewed before saving, and the response ID is the transaction idempotency key so confirmation retries cannot duplicate a launch.
- Account tools and categories use the existing owner-scoped data hooks to preserve cross-device persistence and isolation.
- Home voice entry reuses authenticated assistant proposals and the existing confirmation flow; browser speech recognition only produces an editable transcript.
- Category visualization uses the shared financial aggregation and semantic chart tokens; no chart data is seeded in the UI.
- The browser route gate reads the cached session for immediate tab navigation; data authorization remains enforced by RLS and authenticated server functions.
