const core = require("@actions/core");
const constants = require("./constants");
const github = require("@actions/github");
import {
  addMigrationLabel,
  getChangedFiles,
  getPrNumber,
} from "./pull_request";

// most @actions toolkit packages have async methods
async function run() {
  try {
    console.log("Running");
    const ownerInput = core.getInput(constants.REPO_OWNER);
    const owner = ownerInput !== "" ? ownerInput : github.context.repo.owner;

    const labelNameInput = core.getInput(constants.LABEL_NAME);
    const labelName =
      labelNameInput !== "" ? labelNameInput : constants.LABEL_DEFAULT_NAME;

    const token = core.getInput(constants.GITHUB_TOKEN, { required: true });
    const client = github.getOctokit(token);

    const prNumber = getPrNumber();

    if (!prNumber) {
      core.error("Failed to get pull request information!");
      throw new Error("failed to get pull request");
    }

    const { data: pullRequest } = await client.rest.pulls.get({
      owner: owner === "" ? owner : github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
    });

    const changedFiles = await getChangedFiles(client, prNumber, owner);

    const migrationRe = /\bmigrate\b/g;
    const existLabels = pullRequest.labels.map((label) =>
      label.name ? label.name : ""
    );

    for (const changedFile of changedFiles) {
      console.log(`Changed file found: ${changedFile}`);
      if (changedFile.match(migrationRe)) {
        await addMigrationLabel(
          client,
          prNumber,
          owner,
          labelName,
          existLabels
        );
        break;
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
