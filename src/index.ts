import core = require("@actions/core")
import { context, getOctokit } from "@actions/github"
import { Octokit } from '@octokit/core'
import { getSheet, getGoogleSheetsDoc, appendRow, createExcelInput } from "./sheets"
import { getIsoDateInNorwegianTimezone, norwayTimezone } from "./utils"
import { ActionContext } from './types'

const run = async () => {
  console.log("Started TFSO changelog");
  try {
    const {
      githubApiToken,
      releaseType,
      serviceName,
      team,
      module,
      version,
      googleSheetsId,
      googleEmail,
      googlePrivateKey,
    } = getInputData();

    const octokit = getOctokit(githubApiToken);

    const actionContext = await getActionContext(
      octokit,
      context.payload.repository.name,
      context.runId,
      releaseType
    );

    const input = createExcelInput(
      actionContext,
      serviceName,
      team,
      module,
      version,
      context.runId
    );

    console.log("team", team);
    console.log("Authenticate against google");
    const doc = await getGoogleSheetsDoc(googleSheetsId, {
      client_email: googleEmail,
      private_key: googlePrivateKey,
    });
    console.log("Authentication completed!");
    console.log("Create or get existing sheet");
    const sheet = await getSheet(doc, getTitleForDate());

    console.log("Appending to TFSO excel changelog...");
    await appendRow(sheet, input);
    console.log("Appended release info to TFSO changelog!");
  } catch (error) {
    core.setFailed(error);
  }
}

async function getActionContext(octokit: Octokit, repo: string, runId: number, releaseType: string): Promise<ActionContext> {
  const { data: { repository, triggering_actor: actor, head_commit } } = await octokit.request(
    "GET /repos/{owner}/{repo}/actions/runs/{run_id}",
    {
      owner: "tfso",
      repo,
      run_id: runId,
    }
  );

  const { data: approvals } = await octokit.request(
    "GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals",
    {
      owner: "tfso",
      repo,
      run_id: runId,
    }
  );

  const [approval] = approvals;
  const comment = `${releaseType === "rollback" ? "(ROLLBACK) " : ""}${approval?.comment ?? head_commit?.message}`;

  return {
    deployer: approval?.user.name ?? approval?.user.login ?? actor.name ?? actor.login ?? '',
    comment,
    repository, 
    author: head_commit?.author ?? head_commit.committer ?? { }
  };
}

function getInputData() {
  const googleEmail =
    core.getInput("google_email") || process.env.GOOGLE_CHANGELOG_EMAIL;
  const googlePrivateKey =
    core.getInput("google_private_key") ||
    process.env.GOOGLE_CHANGELOG_PRIVATE_KEY;
  const googleSheetsId =
    core.getInput("google_changelog_spreadsheets_id") ||
    process.env.GOOGLE_CHANGELOG_SPREADSHEETS_ID ||
    "1ShcXzIuG8UhQH4deWLkQLZCfnClwNNgFH7EnNQ9591s";

  const releaseType = core.getInput("release_type");
  const serviceName = core.getInput("service_name");
  const team = core.getInput("team");
  const module = core.getInput("module");
  const githubApiToken = 
    core.getInput("GITHUB_TOKEN") ||
    process.env.GITHUB_TOKEN;

  const version =
    core.getInput("version") || context.ref.replace("refs/tags/", "");
  return {
    githubApiToken,
    releaseType,
    serviceName,
    team,
    module,
    version,
    googleSheetsId,
    googleEmail,
    googlePrivateKey,
  };
}

function getTitleForDate() {
  const date = getIsoDateInNorwegianTimezone();
  const year = date.substring(0, 4);
  const month = +date.substring(5, 7);
  return `${year} ${getMonthPart(month)}`;
}

function getMonthPart(month: number) {
  return month % 2
    ? `${getShortMonth(month)}-${getShortMonth(month + 1)}`
    : `${getShortMonth(month - 1)}-${getShortMonth(month)}`;
}

function getShortMonth(month: number) {
  return new Date(`2020-${month}-01`).toLocaleString(
    'en-US', 
      {
      ...norwayTimezone,
      month: "short"
    }
  );
}

run();
