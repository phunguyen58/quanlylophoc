# Project-local Codex home (optional)

Use this directory as `CODEX_HOME` when you want the repo’s Codex settings
(larger `project_doc_max_bytes`) without changing your global `~/.codex`.

```bash
export CODEX_HOME="$(pwd)/.codex"
codex
```

Codex still loads the repository root [`AGENTS.md`](../AGENTS.md), which requires
[`docs/KNOWLEDGE.md`](../docs/KNOWLEDGE.md) and [`docs/architecture.md`](../docs/architecture.md).

Do not put secrets here. Session logs belong elsewhere (e.g. `.codex-log/`, gitignored).
