# GitHub Copilot — duaer-spec

Treat agents as **digital employees**. Humans state intent; you run Brief → work → accept.

**Precedence:** `AGENTS.md` > `DUADER.md` / `.duaer/`

1. Isolate on `feat|fix/<name>` under `.worktree/feat-<name>/` (never name the worktree after `.duaer/specs/<nnn-slug>/`).
2. Follow `AGENTS.md` § Autonomous job loop (skill: `.agents/skills/duaer-do/SKILL.md` when present).
3. Do not ask the human to operate slash commands or phase names.
4. One handoff line; never claim done unless `delivery.json` is `accepted`.

See also: `DUADER.md`, `docs/agent/branching-and-release.md`.
