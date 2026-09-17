# AI-first MorePass Skill

## Goal

Ship an Agent Skill so any AI that opens `skills/morepass/SKILL.md` can use MorePass correctly without inventing motion stacks.

## In scope

- Author `skills/morepass/SKILL.md` + `examples.md` (recipes, decision tree, API map)
- Mirror into `.agents/skills/morepass/`, `.cursor/skills/morepass/`, `.claude/skills/morepass/`
- Point README at the Skill; bump library narrative to v0.3.0 (keyframes, quickTo, paused scrub)
- Keep prior API work (keyframes / quickTo / expand-in-place demo) on this branch

## Out of scope

- npm publish / remote push (unless asked)
- New runtime animation features beyond what already landed for 0.3.0

## Acceptance

- [ ] Skill exists at `skills/morepass/SKILL.md` with clear WHEN/WHAT description frontmatter
- [ ] Host mirrors are identical
- [ ] README links the Skill as the AI entry point
- [ ] `npm test` and `npm run build` pass in the worktree
