const core = require("@actions/core");
const github = require("@actions/github");

export function getPrNumber() {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
}

export async function getChangedFiles(client, prNumber, owner) {
  const fileOptionList = client.rest.pulls.listFiles.endpoint.merge({
    owner: owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });

  const listFilesResponse = await client.paginate(fileOptionList);
  const changedFiles = listFilesResponse.map((f) => f.filename);

  return changedFiles;
}

export async function addMigrationLabel(
  client,
  prNumber,
  owner,
  labelName,
  existLabels
) {
  core.info(`${labelName} will be added`);
  core.info("Adding migration labels..");

  existLabels.push(labelName);

  return await client.rest.issues.addLabels({
    owner: owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels: existLabels,
  });
}
