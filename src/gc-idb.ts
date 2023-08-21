/**
 * IndexedDB is used to store extension data.
 * Each classroom will have a database named after their ID, with two stores.
 *  - assigneesStore
 *  - subgroupsStore
 * If two Google accounts are signed in LOCALLY and both have teacher permissions on that
 * particular Google Classroom, they will have access to that same classroom database.
 */

import { DBSchema, IDBPDatabase, IDBPObjectStore, openDB } from "idb";
import { GoogleClassroomAssigneeInfo } from "./gc-assignees";

const ASSIGNEES_STORE_NAME = "assigneesStore";
const ASSIGNEES_STORE_KEY_PATH = "id";
const SUBGROUPS_STORE_NAME = "subgroupsStore";
const SUBGROUPS_STORE_KEY_PATH = "subgroupName";

interface IClassroomDB extends DBSchema {
  assigneesStore: {
    key: string;
    value: GoogleClassroomAssigneeInfo;
    indexes: { "sort-last-name": string; "sort-email": string };
  };
  subgroupsStore: {
    key: string;
    value: GoogleClassroomSubgroupInfo;
    indexes: { "sort-name": string };
  };
}
type DB = IDBPDatabase<IClassroomDB>;

export type GoogleClassroomSubgroupInfo = {
  subgroupName: string;
  assigneeIds: string[];
};

export async function connectToDb(classroomId: string) {
  const db = await openDB<IClassroomDB>(classroomId, 2, {
    upgrade(db, lastOpenedVer, _, transaction) {
      console.log(lastOpenedVer);

      switch (lastOpenedVer) {
        case 0:
        // if the user had went on Google Classroom for first time
        // after installing this ext
        // @ts-ignore
        case 1:
          // create assigneesStore if not exist alr
          if (!db.objectStoreNames.contains(ASSIGNEES_STORE_NAME)) {
            const store = db.createObjectStore(ASSIGNEES_STORE_NAME, {
              keyPath: ASSIGNEES_STORE_KEY_PATH,
            });
            store.createIndex("sort-last-name", "lastName", { unique: false });
          }

          // create subgroupsStore if not exist alr
          if (!db.objectStoreNames.contains(SUBGROUPS_STORE_NAME)) {
            db.createObjectStore(SUBGROUPS_STORE_NAME, {
              keyPath: SUBGROUPS_STORE_KEY_PATH,
            });
          }
        case 2:
          // add an email index if nonexistent
          const assigneesStore = transaction.objectStore("assigneesStore");

          if (!assigneesStore.indexNames.contains("sort-email")) {
            assigneesStore.createIndex("sort-email", "email", {
              unique: false,
            });
          }
      }
    },
  });

  // // for version 2, turn any undefined email to "" for sorting purposes
  // // NOTE: this does not affect emails containing errors
  // // NOTE:  attempting to get assignee data with error is impossible,
  // //        since you can only access it with valid email or ID
  // const allAssignees = await getAssigneeList(db);
  // const assigneesWithNullEmail = allAssignees
  //   .filter((a) => a.email === undefined)
  //   .map((a) => ({ ...a, email: "" }));
  // assigneesWithNullEmail.length &&
  //   (await updateAssigneeList(db, assigneesWithNullEmail));

  return db;
}

export async function updateAssigneeList(
  db: DB,
  assignees: GoogleClassroomAssigneeInfo[]
) {
  const tx = db.transaction("assigneesStore", "readwrite");
  const store = tx.objectStore("assigneesStore");

  await Promise.all([...assignees.map((a) => store.put(a)), tx.done]);
}

export async function getAssignee(db: DB, id: string) {
  const tx = db.transaction("assigneesStore", "readonly");
  const store = tx.objectStore("assigneesStore");

  const assignee = await store.get(id);
  await tx.done;

  return assignee;
}

export async function getAssigneeByEmail(db: DB, email: string) {
  const tx = db.transaction("assigneesStore", "readonly");
  const emailIndex = tx.objectStore("assigneesStore").index("sort-email");

  const assignee = await emailIndex.get(email);
  await tx.done;

  return assignee;
}

export async function getAssigneeList(db: DB) {
  const tx = db.transaction("assigneesStore", "readonly");
  const index = tx.objectStore("assigneesStore").index("sort-last-name");

  const assignees = await index.getAll();
  await tx.done;

  return assignees;
}

export async function deleteAssignee(db: DB, assigneeId: string) {
  // delete the assignee from assignee lists
  const subgroups = await getSubgroupList(db);
  const modifiedSubgroups = subgroups.map((s) => ({
    ...s,
    assigneeIds: s.assigneeIds.filter((id) => id !== assigneeId),
  }));
  await Promise.all([...modifiedSubgroups.map((us) => updateSubgroup(db, us))]);

  // delete the assignee itself
  const assigneesTx = db.transaction("assigneesStore", "readwrite");
  const assigneesStore = assigneesTx.objectStore("assigneesStore");

  await assigneesStore.delete(assigneeId);
  await assigneesTx.done;
}

export async function updateSubgroup(
  db: DB,
  subgroup: GoogleClassroomSubgroupInfo
) {
  const tx = db.transaction("subgroupsStore", "readwrite");
  const store = tx.objectStore("subgroupsStore");

  await store.put(subgroup);
  await tx.done;
}

export async function deleteSubgroup(db: DB, subgroupName: string) {
  const tx = db.transaction("subgroupsStore", "readwrite");
  const store = tx.objectStore("subgroupsStore");

  await store.delete(subgroupName);
  await tx.done;
}

export async function clearSubgroups(db: DB) {
  const tx = db.transaction("subgroupsStore", "readwrite");
  const store = tx.objectStore("subgroupsStore");

  await store.clear();
  await tx.done;
}

export async function getSubgroup(db: DB, subgroupName: string) {
  const tx = db.transaction("subgroupsStore", "readonly");
  const store = tx.objectStore("subgroupsStore");

  const subgroupInfo = await store.get(subgroupName);
  await tx.done;

  return subgroupInfo;
}

export async function getSubgroupList(db: DB) {
  const tx = db.transaction("subgroupsStore", "readonly");
  const store = tx.objectStore("subgroupsStore");

  const subgroups = await store.getAll();
  await tx.done;

  return subgroups;
}
