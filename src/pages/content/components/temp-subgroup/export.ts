/**
 * Caches data for exporting to CSV.
 */

import {
  EMAIL_REGEX,
  GoogleClassroomAssigneeInfo,
} from "../../../../gc-assignees";
import { connectToDb, getAssignee } from "../../../../gc-idb";
import { GoogleClassroomTempSubgroupInfo } from "./stores";

interface IAssigneeMapping {
  [id: string]: Omit<GoogleClassroomAssigneeInfo, "pfpUrl" | "id">;
}
type JSONSerializableTempSubgroup = {
  subgroupName: string;
  assigneeIds: string[];
};

/**
 * Generate an assignee mapping that is JSON friendly and uses local cache to speed up generation.
 * @param assigneeIds
 * @param classroomId
 * @returns A JSON-serializable mapping of assignee data.
 */
async function cacheAssigneeMapping(
  assigneeIds: string[],
  classroomId: string
) {
  const assigneeMapping: Map<string, GoogleClassroomAssigneeInfo> = new Map();
  let jsonAssigneeMapping: IAssigneeMapping = {};

  for (const id of assigneeIds) {
    // at most O(N) of entire Google Classroom list since im caching
    if (!assigneeMapping.has(id)) {
      // get data and local cache
      const db = await connectToDb(classroomId);
      const assignee = (await getAssignee(db, id))!;

      assigneeMapping.set(id, assignee);
    }

    const additionalMapping = Object.fromEntries(assigneeMapping);
    jsonAssigneeMapping = { ...jsonAssigneeMapping, ...additionalMapping };
  }

  return jsonAssigneeMapping;
}

async function generateTempSubgroupsJsonData(
  tempSubgroups: GoogleClassroomTempSubgroupInfo[],
  classroomId: string
) {
  // temp subgroups has to be JSON-serializable (for future use such as Firebase and message passing)
  const jsonTempSubgroups: JSONSerializableTempSubgroup[] = [];
  for (const ts of tempSubgroups) {
    const currState = ts.tempStore.getState();

    await cacheAssigneeMapping(currState.tempAssigneeIds, classroomId);

    jsonTempSubgroups.push({
      subgroupName: currState.tempSubgroupName,
      assigneeIds: currState.tempAssigneeIds,
    });
  }

  return jsonTempSubgroups;
}

interface ICSVData {
  firstName: string;
  lastName: string;
  subgroupsIn: string[];
}
export async function generateTempSubgroupsCSVUrl(
  tempSubgroups: GoogleClassroomTempSubgroupInfo[],
  classroomId: string
) {
  // email (preferred) or id -> list of subgroups the assignee is in
  const assigneeIdentifierToSubgroups: Map<string, ICSVData> = new Map();
  for (const ts of tempSubgroups) {
    const currState = ts.tempStore.getState();
    const currSgName = currState.tempSubgroupName;
    const currMapping = await cacheAssigneeMapping(
      currState.tempAssigneeIds,
      classroomId
    );

    for (const id of currState.tempAssigneeIds) {
      const { email, firstName, lastName } = currMapping[id]!;
      // if valid email, use it (100% not undefined since it would fail the test and use id)
      // otherwise, use id
      const identifier = EMAIL_REGEX.test(email ?? "") ? email! : id;
      const csvData = assigneeIdentifierToSubgroups.get(identifier);
      assigneeIdentifierToSubgroups.set(
        identifier,
        csvData
        // if there's existing data, use all existing data and update subgroups
          ? { ...csvData, subgroupsIn: [...csvData.subgroupsIn, currSgName] }
        // else initalize it
          : { firstName, lastName, subgroupsIn: [currSgName] }
      );
    }
  }

  const csvData = [
    '"Assignee Identifier","Subgroup List"\n',
    ...Array.from(assigneeIdentifierToSubgroups).map(
      ([identifier, {firstName, lastName, subgroupsIn}]) =>
        `"${identifier}","${subgroupsIn.join(", ")}","${firstName}","${lastName}"\n`
    ),
  ];
  const csvBlob = new Blob(csvData, {type: "text/csv"});
  return window.URL.createObjectURL(csvBlob);
}
