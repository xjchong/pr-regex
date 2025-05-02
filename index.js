import { getInput, notice, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";

export const run = async () => {
  const content = getInput("content", {
    required: true,
    trimWhitespace: false,
  });
  const regex = getInput("regex", { required: true });
  const regexFlags = getInput("regexFlags");
  const noMatchStrategy = getInput("noMatchStrategy") || "skip";
  const githubToken = getInput("githubToken", { required: true });

  const { owner, repo } = context.repo;
  const octokit = getOctokit(githubToken);

  // If the action was not triggered by a pull request,
  // we can try to find the PR number by searching for the commit.
  let pullRequestNumber = context.payload.pull_request?.number;
  if (!pullRequestNumber) {
    const { data: pullRequests } =
      await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
        owner,
        repo,
        commit_sha: context.sha,
      });

    const pullRequest = pullRequests.find((pr) => {
      context.payload.ref === `refs/head/${pr.head.ref}` && pr.state === "open";
    });

    pullRequestNumber = pullRequest?.number;

    if (!pullRequestNumber) {
      setFailed(`No open pull request found for ${context.eventName}, ${context.sha}`);
      return;
    }
  }

  notice(`Successfully found pull request number: ${pullRequestNumber}`);

  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullRequestNumber,
  });
  let body = data.body;

  if (!body) {
    notice(`Pull request body is empty or undefined: ${body}`);
  }

  const regexp = RegExp(regex, regexFlags);

  if (body && body.match(regexp)) {
    notice(`Found regex match in pull request body, replacing with content.`);
    body = body.replace(regexp, content);
  } else if (noMatchStrategy === "prepend") {
    notice(`No regex match found, using preprend strategy to prepend content to pull request body.`);
    body = content + body;
  } else if (noMatchStrategy === "append") {
    notice(`No regex match found, using append strategy to append content to pull request body.`);
    body += content;
  } else {
    notice(`No regex match found, using skip strategy and making no updates to pull request body.`);
  }

  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: pullRequestNumber,
    body,
  });
};

run().catch((error) => setFailed(error.message));
