import { EMAIL_REGEX } from "../../../../gc-assignees";
import Papa from "papaparse";
import { SUBGROUP_NAME_REGEX } from "./TempAssigneeSubgroup";

export interface ICSVInfo {
  headers: string[];
  data: string[][];
}

/**
 * KEY = subgroup name
 *
 * VALUE = assignee identifiers (emails and/or IDs)
 */
export type ImportedSubgroupsMapping = Map<string, string[]>;

export async function parseCSVContents(
  csvFile: File
): Promise<ICSVInfo | string> {
  const content = await csvFile.text();

  try {
    const { data, errors } = Papa.parse<string[]>(content, {
      delimiter: ",",
      skipEmptyLines: "greedy",
    });
    if (data.length === 0 || data.length === 1) {
      return "You cannot have an empty spreadsheet or a spreadsheet that only contains headers.";
    }

    const errStringSet: Set<string> = new Set();
    for (const { code } of errors) {
      switch (code) {
        case "InvalidQuotes":
        case "MissingQuotes":
        case "UndetectableDelimiter":
          errStringSet.add(
            "→ Your .CSV file is corrupt. Download your spreadsheet again and try again."
          );
          break;
        case "TooFewFields":
        case "TooManyFields":
          // doesn't matter since header option was not set
          // if we get this error still, just skip it
          break;
      }
    }
    const errMsg = Array.from(errStringSet).join("\n");
    if (errMsg !== "") {
      return errMsg;
    }

    return { headers: data[0], data: data.slice(1) };
  } catch (e) {
    return "An unknown error occured when parsing the spreadsheet. Please try again. If the issue still persists, please contact support.";
  }
}

function attemptAutoSelectHeader(headers: string[], keywords: string[]) {
  for (const head of headers) {
    const lowerHead = head.toLowerCase();

    for (const keyword of keywords) {
      if (lowerHead.includes(keyword)) {
        return head;
      }
    }
  }

  return null;
}

// sorted by most to least important
const IDENTIFIER_COLUMN_HEADER_KEYWORDS = [
  "identifier",
  "email",
  "e-mail",
  "assignees",
  "assignee",
  "google classroom id",
  "google id",
  "address",
  "student",
  "id",
];
export function attemptAutoSelectIdentifierHeader({ headers }: ICSVInfo) {
  return attemptAutoSelectHeader(headers, IDENTIFIER_COLUMN_HEADER_KEYWORDS);
}

// sorted by most to least important
const SUBGROUPS_COLUMN_HEADER_KEYWORDS = [
  "subgroups",
  "subgroup",
  "groups",
  "group",
  "periods",
  "period",
  "list",
];
export function attemptAutoSelectSubgroupsHeader({ headers }: ICSVInfo) {
  return attemptAutoSelectHeader(headers, SUBGROUPS_COLUMN_HEADER_KEYWORDS);
}

const GC_ID_REGEX = /^[0-9]+$/;
/**
 * Verify the format for each column data.
 * @param data The rows that aren't headers.
 * @param identifierHeaderIndex What location on the row the identifier is located.
 * @param subgroupsHeaderIndex What location on the row the subgroups are located.
 * @returns If error, then it will return two arrays with what data is invalid. Otherwise, it
 * returns a mapping (subgroup name -> assignee identifiers).
 */
export function verifyIdentifierAndSubgroupsColumnDataFormat(
  data: string[][],
  identifierHeaderIndex: number,
  subgroupsHeaderIndex: number
) {
  // subgroup name -> assignee IDs
  const subgroupsMapping: ImportedSubgroupsMapping = new Map();
  const validIdentifiers: string[] = [];
  const invalidIdentifiers: string[] = [];
  const invalidSubgroupNames: string[] = [];

  for (const row of data) {
    const possibleIdentifier = row[identifierHeaderIndex].trim();
    const isIdentifierValid =
      EMAIL_REGEX.test(possibleIdentifier) ||
      GC_ID_REGEX.test(possibleIdentifier);
    if (!isIdentifierValid) {
      invalidIdentifiers.push(possibleIdentifier !== "" ? possibleIdentifier : "(empty)");
    }
    else {
      validIdentifiers.push(possibleIdentifier);
    }

    // even if identifier is invalid, check for subgroups
    const verifiedSubgroupNames = row[subgroupsHeaderIndex]
      .split(",")
      .map((s) => {
        const subgroupName = s.trim();  // allows "," and ", " while making sure name isnt just only whitespace

        if (!SUBGROUP_NAME_REGEX.test(subgroupName)) {
          invalidSubgroupNames.push(subgroupName !== "" ? subgroupName : "(empty)");
          return null;
        }

        // from this point onwards, the subgroups name is valid
        // now check if it already exists or not
        if (!subgroupsMapping.has(subgroupName)) {
          subgroupsMapping.set(subgroupName, []);
        }

        return subgroupName;
      });

    // now, if the identifier is valid, then add to subgroups
    if (isIdentifierValid) {
      for (const name of verifiedSubgroupNames) {
        if (name) {
          // has to exist since every verified subgroup name has an array
          subgroupsMapping.get(name)!.push(possibleIdentifier);
        }
      }
    }
  }

  const containsErrors =
    !!invalidIdentifiers.length || !!invalidSubgroupNames.length;
  return containsErrors
    ? {
        containsErrors,
        invalidIdentifiers,
        invalidSubgroupNames,
      }
    : {
        containsErrors,
        subgroupsMapping,
        validIdentifiers,
      };
}

