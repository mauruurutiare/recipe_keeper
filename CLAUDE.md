# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

**Push to GitHub after every code change.**

- After making any code change (new feature, bug fix, refactor, config update), stage and commit the changes, then push to the remote repository immediately.
- Use clear, descriptive commit messages that explain what changed and why.
- Do not accumulate multiple unrelated changes into a single commit — commit and push each logical change separately.

```bash
git add <files>
git commit -m "description of change"
git push
```

## デプロイ情報

- 本番URL：https://recipe-keeper-beta.vercel.app
- Supabaseプロジェクト名：recipe_keeper
