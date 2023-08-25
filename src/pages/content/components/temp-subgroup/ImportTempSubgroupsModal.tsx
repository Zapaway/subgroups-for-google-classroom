import { useRef } from "react";
import {
  ICSVInfo,
  ImportedSubgroupsMapping,
  attemptAutoSelectIdentifierHeader,
  attemptAutoSelectSubgroupsHeader,
  parseCSVContents,
  verifyIdentifierAndSubgroupsColumnDataFormat,
} from "./import";
import { create } from "zustand";
import {
  GoogleClassroomSubgroupInfo,
  clearSubgroups,
  connectToDb,
  getAssignee,
  getAssigneeByEmail,
  updateSubgroup,
} from "../../../../gc-idb";
import { usePageInfoStore } from "../../../../gc-hooks";
import {
  EMAIL_REGEX,
  GoogleClassroomAssigneeInfo,
} from "../../../../gc-assignees";
import ImportedSubgroupInfo from "./ImportedSubgroupInfo";
import { useTempSubgroupsStore } from "./stores";

// inspiration from https://stackoverflow.com/questions/76400460/html-dialog-closes-automatically-when-file-input-is-cancelled-how-to-prevent
let prematurelyClosed = false;
declare const window: Window &
  typeof globalThis & {
    import_modal: HTMLDialogElement;
  };

const EMPTY_CSV_INFO = { headers: [], data: [] };

// keep track of imported subgroups info
interface GCImportedSubgroupExtendedInfo {
  subgroupName: string;
  assigneesFound: GoogleClassroomAssigneeInfo[];
  assigneesNotFound: string[];
}
const EMPTY_IMPORTED_SUBGROUPS_INFO: GCImportedSubgroupExtendedInfo = {
  subgroupName: "",
  assigneesFound: [],
  assigneesNotFound: [],
};

interface ITempStepStoreProps {
  step: number;
  fileErrorMsg: string | null; // step 1
  csvInfo: ICSVInfo; // step 2
  selectedIdentifierHeader: string;
  selectedSubgroupsHeader: string;
  verifyColumnErrorMsg: string[] | null;
  importedSubgroupsInfo: GCImportedSubgroupExtendedInfo[]; // step 3

  // if no msg, it will transition to step 2; otherwise step 1
  // NOTE: initial null won't count
  setFileErrorMessage: (info: SetFileErrorMessageParams) => void;
  // if no msg, it will transition to step 3; otherwise step 2
  // NOTE: initial null won't count
  setSelectedIdentifierHeader: (header: string) => void;
  setSelectedSubgroupsHeader: (header: string) => void;
  setVerifyColumnsDataFormatErrorMsg: (
    mapping: ImportedSubgroupsMapping | null,
    validIdentifiers: string[] | null,
    ...msgs: string[]
  ) => Promise<void>;
  goToStep2: () => void; // go from step 3 back to step 2
  resetProgress: () => void;
}
type SetFileErrorMessageParams =
  | { msg: string }
  | { msg: null; csvInfo: ICSVInfo };

const useImportStepStore = create<ITempStepStoreProps>((set, get) => ({
  step: 1,
  fileErrorMsg: null,
  csvInfo: EMPTY_CSV_INFO, // empty for type convinence
  selectedIdentifierHeader: "",
  selectedSubgroupsHeader: "",
  verifyColumnErrorMsg: null,
  importedSubgroupsInfo: [EMPTY_IMPORTED_SUBGROUPS_INFO],
  finalImportedSubgroups: [],

  setFileErrorMessage: (info) => {
    if (info.msg !== null) {
      set({ step: 1, fileErrorMsg: info.msg, csvInfo: EMPTY_CSV_INFO });
    } else {
      const { csvInfo } = info;
      set({
        step: 2,
        fileErrorMsg: info.msg,
        csvInfo,
        selectedIdentifierHeader:
          attemptAutoSelectIdentifierHeader(csvInfo) ?? "",
        selectedSubgroupsHeader:
          attemptAutoSelectSubgroupsHeader(csvInfo) ?? "",
        verifyColumnErrorMsg: null,
        importedSubgroupsInfo: [EMPTY_IMPORTED_SUBGROUPS_INFO],
      });
    }
  },
  setSelectedIdentifierHeader: (header) =>
    set({ selectedIdentifierHeader: header }),
  setSelectedSubgroupsHeader: (header) =>
    set({ selectedSubgroupsHeader: header }),
  setVerifyColumnsDataFormatErrorMsg: async (
    mapping,
    validIdentifiers,
    ...msgs
  ) => {
    if (!msgs.length) {
      if (mapping === null || validIdentifiers === null) {
        throw new Error(
          "This is a developer error. Please make sure to pass in a mapping."
        );
      }

      // now make sure assignees exist in the db
      const classroomId = usePageInfoStore.getState().classroomId;
      const db = await connectToDb(classroomId);
      const assigneesInfoMap: Map<string, GoogleClassroomAssigneeInfo> =
        new Map();

      // validate each identity
      for (const iden of validIdentifiers) {
        let assignee: GoogleClassroomAssigneeInfo | undefined;

        if (EMAIL_REGEX.test(iden)) {
          // it's email
          assignee = await getAssigneeByEmail(db, iden);
        } else {
          // it's id
          assignee = await getAssignee(db, iden);
        }

        if (assignee) {
          assigneesInfoMap.set(iden, assignee);
        }
      }

      // transform validated data into subgroups
      const subgroups: GCImportedSubgroupExtendedInfo[] = [];
      for (const [sgName, allAssigneeIdens] of mapping) {
        const assigneeFoundInfo: GoogleClassroomAssigneeInfo[] = [];
        const assigneeNotFoundInfo: string[] = [];

        for (const identity of allAssigneeIdens) {
          const res = assigneesInfoMap.get(identity);
          res
            ? assigneeFoundInfo.push(res)
            : assigneeNotFoundInfo.push(identity);
        }

        subgroups.push({
          subgroupName: sgName,
          assigneesFound: assigneeFoundInfo,
          assigneesNotFound: assigneeNotFoundInfo,
        });
      }

      set({
        step: 3,
        verifyColumnErrorMsg: null,
        importedSubgroupsInfo: subgroups,
      });
    } else {
      set({ verifyColumnErrorMsg: msgs });
    }
  },
  goToStep2: () => {
    set({
      step: 2,
      importedSubgroupsInfo: [EMPTY_IMPORTED_SUBGROUPS_INFO],
    });
  },
  resetProgress: () =>
    set({
      step: 1,
      fileErrorMsg: null,
      csvInfo: EMPTY_CSV_INFO,
      selectedIdentifierHeader: "",
      selectedSubgroupsHeader: "",
      verifyColumnErrorMsg: null,
      importedSubgroupsInfo: [EMPTY_IMPORTED_SUBGROUPS_INFO],
    }),
}));

const IDENTIFIER_DEFAULT_OPTION = "Which column contains emails and/or IDs?";
const SUBGROUPS_DEFAULT_OPTION = "Which column contains subgroups?";

export default function ImportTempSubgroupsModal() {
  const validSpreadsheetImgUrl = chrome.runtime.getURL("valid-spreadsheet.png");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // step information
  const [
    step,
    fileErrorMsg,
    verifyColumnErrorMsg,
    csvInfo,
    selectedIdentifierHeader,
    selectedSubgroupsHeader,
    importedSubgroupsInfo,
    setFileErrorMsg,
    setSelectedIdentifierHeader,
    setSelectedSubgroupsHeader,
    setVerifyColumnsDataFormatErrorMsg,
    goToStep2,
    resetProgress,
  ] = useImportStepStore((state) => [
    state.step,
    state.fileErrorMsg,
    state.verifyColumnErrorMsg,
    state.csvInfo,
    state.selectedIdentifierHeader,
    state.selectedSubgroupsHeader,
    state.importedSubgroupsInfo,
    state.setFileErrorMessage,
    state.setSelectedIdentifierHeader,
    state.setSelectedSubgroupsHeader,
    state.setVerifyColumnsDataFormatErrorMsg,
    state.goToStep2,
    state.resetProgress,
  ]);

  return (
    <dialog
      id="import_modal"
      className="modal"
      onCancel={(e) => {
        // detecting closing modal from cancelling file input
        if (fileInputRef.current && fileInputRef.current === e.target) {
          prematurelyClosed = true;
          return;
        }
      }}
      onClose={(e) => {
        if (prematurelyClosed) {
          window.import_modal.showModal();
          prematurelyClosed = false;
          return;
        }

        // if not premature, then it was actually closed
        fileInputRef.current!.value = "";
        resetProgress();
      }}
    >
      <form method="dialog" className="modal-box w-full max-w-5xl">
        <h3 className="text-lg font-bold">📦 Import Subgroups</h3>
        {step === 1 && (
          <div>
            <div className="flex flex-col gap-3 py-3">
              <div className="text-base">
                <p>
                  Your spreadsheet should have these two columns: the email
                  address (or Google Classroom ID if it doesn't exist) and the
                  subgroups.
                </p>
                <ul className="list-disc text-sm pl-5">
                  <li>
                    There should be a list of subgroup names seperated by commas
                    for every email/ID.
                  </li>
                  <li>
                    Each subgroup name can only contain alphabets, numbers,
                    spaces, dashes, and underscores.
                  </li>
                  <li className="underline">
                    Attempting to use commas in a name will create two subgroups
                    instead of one.
                  </li>
                  <li>
                    {" "}
                    If there are duplicate emails/IDs, then all previous
                    subgroups will be combined. If you want it to only detect
                    the most recent entry, manually delete the student's old
                    entries or, if using online forms, allow them to edit their
                    responses.
                  </li>
                </ul>
                <p className="font-bold">
                  <u>
                    Make sure to export a .CSV file that has headers and at
                    least one row of data.
                  </u>
                </p>
              </div>
              <div>
                <details className="text-sm bg-orange-100 border border-orange-300 p-2 rounded-sm">
                  <summary className="font-bold hover:cursor-pointer">
                    🪪 What is a Google Classroom ID?
                  </summary>
                  <p>
                    Refreshing the list can sometimes (albeit very rarely) stop
                    detecting the email of a student. In this case, instead of
                    an email below the student's name, an error message will be
                    displayed along with an ID Google Classroom automatically
                    generates. Use this ID in place of the email when importing
                    subgroups.{" "}
                    <i>
                      Note that a student's school ID is different from a Google
                      Classroom ID.
                    </i>
                  </p>
                </details>
                <details className="text-sm bg-green-100 border border-green-300 p-2 rounded-sm">
                  <summary className="font-bold hover:cursor-pointer">
                    🗼 Can my spreadsheet have other columns? Can the email
                    column contain Google Classroom IDs (and vice versa)?
                  </summary>
                  <p>
                    After uploading your .CSV file, you will be prompted to
                    select the column that has emails/IDs and the column that
                    has subgroup names. One column can contain emails, Google
                    Classroom IDs, or a mix. You cannot have a seperate column
                    for emails and a seperate column for Google Classroom IDs.
                  </p>
                </details>
                <details className="text-sm bg-purple-100 border border-purple-300 p-2 rounded-sm">
                  <summary className="font-bold hover:cursor-pointer">
                    📝 How would I set this up on a Google Form students can
                    fill out?
                  </summary>
                  <p>
                    This feature was developed with Google Forms in mind! All
                    you need to do is{" "}
                    <a
                      href="https://support.google.com/docs/answer/139706?hl=en#zippy=%2Ccollect-respondents-email-addresses"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="link text-purple-800"
                    >
                      enable "Collect email addresses"
                    </a>{" "}
                    and have a checkbox (or multiple-choice) question that asks
                    the student what subgroup they want to be a part of. If you
                    want to allow students to change their subgroups at any
                    time, enabling "Limit to 1 response" and "Allow response
                    editing" is recommended. It is okay to have other questions,
                    as you will be selecting which column contains emails/IDs
                    and which column contain contains subgroup names.
                  </p>
                </details>
              </div>
            </div>
            <img
              src={validSpreadsheetImgUrl}
              alt="A spreadsheet with an email address and subgroups column."
              className="w-full"
            />
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col gap-3 py-3">
            <p className="text-base">
              Select the column containing the emails and/or IDs and the column
              containing the subgroups. Note that if the header is the data
              itself (e.g. data "support@kennethchap.dev" instead of header
              "Assignees"), then you might've done something wrong.
            </p>
            <div className="grid grid-cols-2 mb-3">
              <div>
                <label className="label">
                  <span className="label-text">Emails/IDs column</span>
                </label>
                <select
                  className="select select-bordered"
                  onChange={(e) =>
                    setSelectedIdentifierHeader(e.currentTarget.value)
                  }
                >
                  <option disabled selected={selectedIdentifierHeader === ""}>
                    {IDENTIFIER_DEFAULT_OPTION}
                  </option>
                  {csvInfo.headers.map(
                    (head, i) =>
                      // this will remove any empty headers, while maintaining index integrity
                      // (since we did not remove the headers from orginal array)
                      head.trim() !== "" && (
                        <option
                          key={i}
                          value={head}
                          selected={head === selectedIdentifierHeader}
                        >
                          {head} [Col {i + 1}]
                        </option>
                      )
                  )}
                </select>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Subgroups column</span>
                </label>
                <select
                  className="select select-bordered"
                  onChange={(e) =>
                    setSelectedSubgroupsHeader(e.currentTarget.value)
                  }
                >
                  <option disabled selected={selectedSubgroupsHeader === ""}>
                    {SUBGROUPS_DEFAULT_OPTION}
                  </option>
                  {csvInfo.headers.map((head, i) => {
                    return (
                      head.trim() !== "" && (
                        <option
                          key={i}
                          value={head}
                          selected={head === selectedSubgroupsHeader}
                        >
                          {head} [Col {i + 1}]
                        </option>
                      )
                    );
                  })}
                </select>
              </div>
            </div>
            <button
              className={`btn btn-neutral btn-md hover:btn-info ${
                verifyColumnErrorMsg && "btn-error"
              }`}
              onClick={async (e) => {
                e.preventDefault();

                // make sure columns are not the default
                if (
                  selectedIdentifierHeader === IDENTIFIER_DEFAULT_OPTION ||
                  selectedSubgroupsHeader === SUBGROUPS_DEFAULT_OPTION
                ) {
                  await setVerifyColumnsDataFormatErrorMsg(
                    null,
                    null,
                    "You must select your columns."
                  );
                  return;
                }

                const selectedIdentifierHeaderIndex = csvInfo.headers.findIndex(
                  (h) => h === selectedIdentifierHeader
                );
                const selectedSubgroupsHeaderIndex = csvInfo.headers.findIndex(
                  (h) => h === selectedSubgroupsHeader
                );

                // make sure both columns are different
                if (
                  selectedIdentifierHeaderIndex === selectedSubgroupsHeaderIndex
                ) {
                  await setVerifyColumnsDataFormatErrorMsg(
                    null,
                    null,
                    "You need to pick different columns."
                  );
                  return;
                }

                const verificationRes =
                  verifyIdentifierAndSubgroupsColumnDataFormat(
                    csvInfo.data,
                    selectedIdentifierHeaderIndex,
                    selectedSubgroupsHeaderIndex
                  );

                if (verificationRes.containsErrors) {
                  // one is guaranteed to have an err msg
                  const { invalidIdentifiers, invalidSubgroupNames } =
                    verificationRes;
                  const identifiersErr =
                    !!invalidIdentifiers.length &&
                    `The following identifiers are invalid: ${invalidIdentifiers
                      .map((i) => `<${i}>`)
                      .join(
                        ", "
                      )}. Please check to make sure they are emails and/or Google Classroom IDs.`;
                  const subgroupNamesErr =
                    !!invalidSubgroupNames.length &&
                    `The following subgroup names are invalid: ${invalidSubgroupNames
                      .map((s) => `<${s}>`)
                      .join(
                        ", "
                      )}. Subgroup names can only contain alphabets, numbers, spaces, dashes, and underscores.`;
                  const errs = [identifiersErr, subgroupNamesErr].filter(
                    (err): err is string => typeof err === "string"
                  );
                  await setVerifyColumnsDataFormatErrorMsg(null, null, ...errs);
                  return;
                }

                await setVerifyColumnsDataFormatErrorMsg(
                  verificationRes.subgroupsMapping,
                  verificationRes.validIdentifiers
                );
              }}
            >
              Verify
            </button>
            {verifyColumnErrorMsg && (
              <ul className="list-disc pl-5 text-base text-red-500">
                {verifyColumnErrorMsg.map((errMsg) => (
                  <li>{errMsg}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-col gap-3 py-3">
            <p className="text-base">
              Make sure that the information below is complete and correct. If
              it isn't, press the back button or upload a new spreadsheet.{" "}
            </p>
            <p className="text-base font-bold bg-orange-100 border border-orange-300 p-3 rounded-md ">
              ⚠️ Once you confirm, these imported subgroups will be SAVED into
              the database, WIPING out any subgroups you had before. If you want
              to keep a copy of your old subgroups, please close this import
              window now and export.
            </p>
            <div className="p-2 mb-2 rounded-full flex flex-row justify-evenly bg-gradient-to-r from-blue-300 to-green-300">
              <button
                className="btn btn-neutral hover:btn-info"
                onClick={(e) => {
                  e.preventDefault();
                  goToStep2();
                }}
              >
                ⬅️ Back
              </button>
              <button
                className="btn btn-neutral hover:btn-success"
                onClick={async () => {
                  const currState = useTempSubgroupsStore.getState();
                  const classroomId = usePageInfoStore.getState().classroomId;
                  const db = await connectToDb(classroomId);

                  // delete all temp and db subgroups
                  currState.delAllTempSubgroups();
                  await clearSubgroups(db);

                  // as we are adding subgroups to db, keep them so that
                  // we don't repeat call to db
                  const dbSubgroups: GoogleClassroomSubgroupInfo[] = [];
                  for (const {
                    subgroupName,
                    assigneesFound,
                  } of importedSubgroupsInfo) {
                    const dbSg: GoogleClassroomSubgroupInfo = {
                      subgroupName,
                      assigneeIds: assigneesFound.map((a) => a.id),
                    };
                    dbSubgroups.push(dbSg);
                    await updateSubgroup(db, dbSg);
                  }

                  // load them in and show changes
                  currState.loadSubgroups(dbSubgroups);
                  currState.refreshTempSubgroups();
                }}
              >
                Save & Confirm ✅
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {importedSubgroupsInfo.map(
                ({ subgroupName, assigneesFound, assigneesNotFound }) => {
                  return (
                    <ImportedSubgroupInfo
                      key={subgroupName}
                      subgroupName={subgroupName}
                      assigneeFoundInfo={assigneesFound}
                      assigneeNotFoundInfo={assigneesNotFound}
                    />
                  );
                }
              )}
            </div>
          </div>
        )}
        <div>
          <div className="py-5">
            <div
              className={`${
                step > 1 && "tooltip"
              } w-full tooltip-warning tooltip-bottom`}
              data-tip="Uploading a new spreadsheet may reset any progress."
            >
              <input
                type="file"
                accept=".csv"
                className={`file-input ${fileErrorMsg && "file-input-error"} ${
                  step > 1
                    ? "hover:file-input-warning"
                    : "hover:file-input-info"
                } file-input-bordered w-full`}
                ref={fileInputRef}
                onChange={async (e) => {
                  const files = fileInputRef.current?.files;

                  if (!files || !files.length) {
                    setFileErrorMsg({
                      msg: "Please upload your spreadsheet file.",
                    });
                    return;
                  }

                  const file = files[0];
                  if (file.type !== "text/csv") {
                    setFileErrorMsg({
                      msg: "The file you uploaded is not a .CSV file. Please try again.",
                    });
                    return;
                  }

                  const result = await parseCSVContents(file);
                  if (typeof result === "string") {
                    setFileErrorMsg({ msg: result });
                    return;
                  }

                  // since we have valid data, we can move onto step 2
                  setFileErrorMsg({ msg: null, csvInfo: result });
                }}
              />
              {fileErrorMsg && (
                <p className="font-bold text-base text-red-500 py-1">
                  {fileErrorMsg}
                </p>
              )}
            </div>
          </div>
          <div className="modal-action flex flex-row justify-between">
            <div></div>
            <progress
              className="progress w-56"
              value={(step / 3) * 100}
              max="100"
            ></progress>
            <button className="btn">Close</button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
