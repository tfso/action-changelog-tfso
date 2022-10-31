import { Context } from '@actions/github/lib/context'
const { GoogleSpreadsheet } = require('google-spreadsheet')
import { ActionContext } from './types'
import { getIsoDateInNorwegianTimezone } from "./utils"

export async function appendRow(sheet: any, input: string[]) {
  await sheet.addRow(input);
}

export async function getGoogleSheetsDoc(spreadsheetId: string, credentials: any) {
  const doc = new GoogleSpreadsheet(spreadsheetId);
  await doc.useServiceAccountAuth(credentials);
  return doc;
}

export async function getSheet(doc: any, title: string) {
  await doc.loadInfo();

  return doc.sheetsByTitle[title] ?? (await createFromTemplate(doc, title));
}

async function createFromTemplate(doc: any, title: string) {
  const template = doc.sheetsByTitle["Template"];

  await template.copyToSpreadsheet(doc.spreadsheetId);
  await doc.loadInfo();

  const sheet = doc.locale.startsWith("no_")
    ? doc.sheetsByTitle["Kopi av Template"]
    : doc.sheetsByTitle["Copy of Template"];

  await sheet.updateProperties({ title, index: 0 });
  return sheet;
}

const getInitialsOrNickname = (name: string): string => {
  const initials = String(name)
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("");

    // Some users only have firstName or nickname,
    // we just display their name instead of a single letter
    return initials.length === 1
      ? name
      : initials
}

export const createExcelInput = (
  context: ActionContext,
  serviceName: string,
  team: string,
  module: string,
  version: string,
  runId: number  
): string[] => {
  const isoDate = getIsoDateInNorwegianTimezone();
  const date = isoDate.slice(0, 10);
  const time = isoDate.slice(11, 16);
  const devInitials = getInitialsOrNickname(context.author.name);

  return [
    date,
    time,
    serviceName,
    version,
    context.comment,
    `${context.repository.html_url}/releases/tag/${version}`,
    `${context.repository.html_url}/actions/runs/${runId}`,
    devInitials,
    context.deployer,
    '',
    team
  ];
};