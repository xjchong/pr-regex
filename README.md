Github action to insert content into a pull request description.
Based on [nefrob's pr-description action](https://github.com/nefrob/pr-description).

## Usage

This action supports `pull_request` and `push` events (on open pull requests).

### Inputs

- `content` (required): Content to be added to the PR description
- `regex` (required): Regex to match against the PR description.
- `regexFlags`: Flags to use with the regex.
- `noMatchStrategy`: Strategy to use if no match is found. Can be "skip", "prepend" or "append", defaults to "skip".
- `githubToken` (required): Github access token.