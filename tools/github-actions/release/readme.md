# Create a new Github Release

## Overview

GitHub Action for creating a new release on GitHub.

> [!NOTE]
> This action requires `contents: write` [permission](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token) in order to create the release.

## Task options

See [Action specifications](./action.yml) directly for more information about the supported parameters.

## Usage example

```yaml
- name: Create release
  if: github.event_name != 'pull_request'
  uses:  AmadeusITGroup/otter/tools/github-actions/release
  with:
    version: ${{ nextVersionTag }}
    target: ${{ github.ref_name }}
```