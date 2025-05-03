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

### Example

```yml
name: Automation for PRs
'on':
  pull_request:
    types:
      - opened
jobs:
  add-ticket-to-pr:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write

    steps:
      - name: Extract JIRA Ticket ID
        id: extract_ticket_id
        # Use bash regex to extract the ticket ID from the branch name (github.head_ref),
        # capitalizing it and saving it in the ouput variable ticket_id.
        # If unable to, creates a warning for the developer instead, asking them to add it manually.
        run: |
          if [[ "${{ github.head_ref }}" =~ ([A-Za-z]+-[0-9]+) ]]; then
            TICKET_ID=$(echo "${BASH_REMATCH[1]}" | tr '[:lower:]' '[:upper:]')
          else
            TICKET_ID="(Couldn't find ticket ID in the branch name, please add the ticket ID manually)"
          fi
          echo "ticket_id=$TICKET_ID" >> $GITHUB_OUTPUT

      - name: Add JIRA Ticket ID to PR Description
        uses: xjchong/pr-regex@v1.0.0
        with:
          # This is what will be added to the PR description if the regex is not found.
          content: "## JIRA Ticket\n${{ steps.extract_ticket_id.outputs.ticket_id }}\n"
          # The regex to match and replace is just a copy of what we want to insert.
          # Effectively a no-op, if the header is already present on the PR for some reason.
          regex: "## JIRA Ticket\n${{ steps.extract_ticket_id.outputs.ticket_id }}\n" 
          # This strategy adds the content to the start of the PR description.
          noMatchStrategy: 'prepend'
          githubToken: '${{ secrets.GITHUB_TOKEN }}'
```
