import {
  useAssigneeListStore,
  useGoogleClassroomNameStore,
  usePageInfoStore,
  useUserTypeStore,
} from "../../gc-hooks";
import { GoogleClassroomState } from "../../gc-page-info";
import {
  DROPDOWN_ANIMATION_DURATION_MS,
  EMAIL_REGEX,
  GoogleClassroomAssigneeInfo,
  getAllAssigneesWithoutEmailFromPeopleTab,
  updateAssigneesWithEmailFromPeoplesTab,
} from "../../gc-assignees";
import {
  connectToDb,
  deleteAssignee,
  getAssigneeList,
  updateAssigneeList,
} from "../../gc-idb";
import { AssigneeListScrollbox } from "./components/AssigneeListScrollbox";
import { DragDropContext } from "react-beautiful-dnd";
import TempAssigneeSubgroupScrollbox from "./components/temp-subgroup/TempAssigneeSubgroupScrollbox";
import { useRef, useState } from "react";
import {
  TempSubgroupMap,
  useTempSubgroupsStore,
} from "./components/temp-subgroup/stores";

export default function SubgroupsModal() {
  // info
  const [pageType, classroomID] = usePageInfoStore((state) => [
    state.pageType,
    state.classroomId,
  ]);
  const classroomName = useGoogleClassroomNameStore(
    (state) => state.classroomName
  );
  const isTeacher = useUserTypeStore((state) => state.isTeacher);
  const [disabledMessage, setDisabledMessage] = useState<string | null>(null);
  const manifestData = chrome.runtime.getManifest();

  // button refs
  const addTempSubgroupButtonRef = useRef<HTMLButtonElement>(null);
  const importTempSubgroupButtonRef = useRef<HTMLButtonElement>(null);
  const exportTempSubgroupsButtonRef = useRef<HTMLButtonElement>(null);
  const clearTempSubgroupsButtonRef = useRef<HTMLButtonElement>(null);
  const saveTempSubgroupsButtonRef = useRef<HTMLButtonElement>(null);
  const cancelChangesButtonRef = useRef<HTMLButtonElement>(null);

  // invalidatation functions
  const invalidateAssigneeList = useAssigneeListStore(
    (state) => state.invalidateAssigneeList
  );
  const [deleteAssgineeFromAllTempSubgroups, isDoneInitLoading] =
    useTempSubgroupsStore((state) => [
      state.deleteAssgineeFromAllTempSubgroups,
      state.doneInitLoading,
    ]);

  // image urls for home page
  type StepImageData = { url: string; instructions: string };
  const stepImageUrls: StepImageData[] = [
    {
      url: chrome.runtime.getURL("step1cropped.webp"),
      instructions: "Click on a classroom.",
    },
    {
      url: chrome.runtime.getURL("step2cropped.webp"),
      instructions: "Edit your subgroups.",
    },
    {
      url: chrome.runtime.getURL("step3cropped.webp"),
      instructions: "And you're done!",
    },
  ];

  return (
    <DragDropContext
      onDragEnd={(res, provided) => {
        const { destination, source, draggableId } = res;
        const { tempSubgroups } = useTempSubgroupsStore.getState();

        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        const removeFromSource = () => {
          const removedAssigneeIndex = source.index;
          const srcSubgroupId = source.droppableId;
          const srcSubgroupInfo = tempSubgroups.get(srcSubgroupId)!;
          const srcSubgroupStore = srcSubgroupInfo.tempStore;
          const srcSubgroupAssigneeIds =
            srcSubgroupStore.getState().tempAssigneeIds;

          // remove assignee from subgroup
          srcSubgroupAssigneeIds.splice(removedAssigneeIndex, 1);

          // now force a render
          srcSubgroupStore.setState({
            errorMessage: null,
            tempAssigneeIds: [...srcSubgroupAssigneeIds],
          });
        };
        const addToDestination = () => {
          const destSubgroupId = destination.droppableId;
          const destSubgroupInfo = tempSubgroups.get(destSubgroupId)!;
          const destSubgroupStore = destSubgroupInfo.tempStore;
          const destSubgroupAssigneeIds =
            destSubgroupStore.getState().tempAssigneeIds;

          // make sure that assignee id has no subgroup name attached to it
          const newAssigneeId = draggableId.split("-").at(-1)!;

          // ensure that there aren't duplicates
          if (destSubgroupAssigneeIds.includes(newAssigneeId)) {
            destSubgroupStore.setState({
              errorMessage: "Assignee already exists in subgroup.",
            });
            return false;
          }

          // copy new assignee into the subgroup temp assignee id list
          destSubgroupAssigneeIds.splice(destination.index, 0, newAssigneeId);

          // now force a render (spread since destSubgroupAssigneeIds references to original tempAssigneeIds)
          destSubgroupStore.setState({
            errorMessage: null,
            tempAssigneeIds: [...destSubgroupAssigneeIds],
          });

          return true;
        };

        // user picked up assignee from the entire list and dropped it onto a temp subgroup
        if (source.droppableId === "assigneeList") {
          addToDestination();
        }
        // user picked up assignee from a temp subgroup and put it back into the entire list
        // REMOVE FROM SUBGROUP
        else if (destination.droppableId === "assigneeList") {
          removeFromSource();
        }
        // user moved assignee from one assignee list to another
        // MOVE TO NEW SUBGROUP
        else {
          if (addToDestination()) {
            removeFromSource();
          }
          // if the destination already has the same assignee, then don't do anything
        }
      }}
    >
      <dialog
        id="subgroups_modal"
        className="modal"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
          }
        }}
      >
        <form method="dialog" className="modal-box w-11/12 max-w-6xl">
          <h3 className="text-lg">
            <b className="text-xl">Subgroups for {classroomName}</b> v
            {manifestData.version} by {manifestData.author}
          </h3>
          {isTeacher ? (
            <>
              {
                // only show subgroups on individual GC pages pageType ===
                pageType === GoogleClassroomState.HOME ? (
                  <>
                    <p className="text-base mb-3">
                      Welcome to Subgroups for Google Classroom! Get started
                      with these three steps.
                    </p>
                    <div className="grid grid-cols-3 gap-7 mb-3 place-content-evenly">
                      {stepImageUrls.map((info, i) => (
                        <div className="flex flex-col" key={i}>
                          <div className="avatar">
                            <div className="rounded-xl drop-shadow-xl">
                              <img src={info.url} />
                            </div>
                          </div>
                          <h1 className="text-5xl text-center pt-5">
                            Step {i + 1}
                          </h1>
                          <p className="text-xl text-center py-3">
                            {info.instructions}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div>
                    <details className="text-base mb-3 bg-yellow-100 border border-yellow-300 p-3 mt-3 rounded-md">
                      <summary>
                        ⚠️ This is where you can add, edit, and remove subgroups
                        for <b>{classroomName}</b>! Please note that there are
                        some caveats.
                      </summary>
                      <ul className="list-disc px-5">
                        <li>
                          Does not save across different computers (it is stored
                          in this browser only)
                        </li>
                        <li>
                          Students can't modify subgroups unless if they have
                          access to "Inspect element"
                        </li>
                        <li>Might not work on Incognito</li>
                        <li>Subgroups will disappear if cookies are cleared</li>
                        <li>
                          Don't use Safari, as it clears all subgroups after 7
                          days of inactivity
                        </li>
                      </ul>
                    </details>
                    <p className="mb-3 text-base">
                      If you encounter any bugs, please report it through the{" "}
                      <a
                        className="link"
                        target="_blank"
                        rel="noreferrer noopener"
                        href="https://chrome.google.com/webstore/detail/subgroups-for-google-clas/liihdnckdcohbeincekdciebinhmpfab"
                      >
                        "Support" section in the Chrome Extension store 🏪
                      </a>
                      .
                    </p>
                    <div className="grid grid-cols-2 gap-4 w-full h-96">
                      <TempAssigneeSubgroupScrollbox
                        addButtonRef={addTempSubgroupButtonRef}
                        importButtonRef={importTempSubgroupButtonRef}
                        exportButtonRef={exportTempSubgroupsButtonRef}
                        clearButtonRef={clearTempSubgroupsButtonRef}
                        saveButtonRef={saveTempSubgroupsButtonRef}
                        cancelButtonRef={cancelChangesButtonRef}
                      />
                      <AssigneeListScrollbox />
                    </div>
                  </div>
                )
              }
              <div className="mt-2 grid grid-cols-2 gap-4">
                {
                  // only allow adding subgroups on individual GC pages
                  pageType !== GoogleClassroomState.HOME && isDoneInitLoading && (
                    <div className="flex flex-row justify-between">
                      <div className="flex flex-col gap-1 md:flex-row md:gap-2">
                        <div>
                          <button
                            className="btn btn-xs"
                            ref={addTempSubgroupButtonRef}
                            onClick={(e) => {
                              // this is safe guard in case ref was not set yet
                              e.preventDefault();
                            }}
                          >
                            ✏️ Add
                          </button>
                        </div>
                        <div
                          className="tooltip tooltip-bottom"
                          data-tip="Learn about how to import here!"
                        >
                          <button
                            className="btn btn-xs"
                            ref={importTempSubgroupButtonRef}
                            onClick={(e) => {
                              // this is safe guard in case ref was not set yet
                              e.preventDefault();
                            }}
                          >
                            📦 Import
                          </button>
                        </div>
                        <div
                          className="tooltip tooltip-bottom"
                          data-tip="Transferring or backing up your subgroups? Download your spreadsheet here."
                        >
                          <button
                            className="btn btn-xs"
                            ref={exportTempSubgroupsButtonRef}
                            onClick={async (e) => {
                              // this is safe guard in case ref was not set yet
                              e.preventDefault();
                            }}
                          >
                            🚀 Export
                          </button>
                        </div>
                      </div>
                      <div>
                        <button
                          className="btn btn-xs"
                          ref={clearTempSubgroupsButtonRef}
                          onClick={async (e) => {
                            // this is safe guard in case ref was not set yet
                            e.preventDefault();
                          }}
                        >
                          🗑️ Clear
                        </button>
                      </div>
                    </div>
                  )
                }
                {
                  // only show refresh list option if user is on "people" tab
                  pageType === GoogleClassroomState.PEOPLE && (
                    <div className="flex flex-col justify-start items-end sm:flex-row sm:justify-end sm:items-center gap-2">
                      {disabledMessage && (
                        <p className="text-sm italic text-right">
                          {disabledMessage}
                        </p>
                      )}
                      <div className="flex flex-row gap-2 shrink-0">
                        {disabledMessage && (
                          <span className="loading loading-spinner loading-sm shrink-0"></span>
                        )}
                        <button
                          className={`btn btn-xs ${
                            disabledMessage && "btn-disabled"
                          }`}
                          onClick={async (e) => {
                            e.preventDefault();

                            const db = await connectToDb(classroomID);
                            const oldAssignees = await getAssigneeList(db);
                            const oldAssigneesMap = new Map(
                              oldAssignees.map((a) => [a.id, a])
                            );
                            const parsedAssignees =
                              getAllAssigneesWithoutEmailFromPeopleTab();
                            const parsedAssigneesIds = new Set(
                              parsedAssignees.map((a) => a.id)
                            );
                            const parsedAssigneesMap = new Map(
                              parsedAssignees.map((a) => [a.id, a])
                            );
                            const nameChangeTempSubgroupsMap: TempSubgroupMap =
                              new Map();

                            // --- OLD ASSIGNEES OR ASSIGNEES WITH OUTDATED NAMES
                            // if the new assignee list doesn't contain the db assignee,
                            // it needs to be deleted
                            await Promise.all(
                              oldAssignees.map(
                                async ({ id, firstName, lastName }) => {
                                  if (!parsedAssigneesIds.has(id)) {
                                    await deleteAssignee(db, id);
                                    deleteAssgineeFromAllTempSubgroups(id);
                                  } else {
                                    const {
                                      firstName: newFirstName,
                                      lastName: newLastName,
                                    } = parsedAssigneesMap.get(id)!;
                                    // there was a rare name change
                                    if (
                                      firstName !== newFirstName ||
                                      lastName !== newLastName
                                    ) {
                                      // get all of the temp subgroups the user is in
                                      const activeTempSubgroups =
                                        useTempSubgroupsStore
                                          .getState()
                                          .getAllTempSubgroupsBasedOn(id);
                                      // and change the name
                                      activeTempSubgroups.forEach((sg) =>
                                        nameChangeTempSubgroupsMap.set(
                                          sg.subgroupName,
                                          sg
                                        )
                                      );
                                    }
                                  }
                                }
                              )
                            );

                            const finalAssigneeList: GoogleClassroomAssigneeInfo[] =
                              [];

                            // --- EXISTING ASSIGNEES
                            // will need to transfer emails from oldAssignees to newAssignees
                            // NOTE: existing assignee with invalid email will count as one without email
                            // NOTE: emails cannot change
                            const newAssigneesWithoutEmail: Map<
                              string,
                              GoogleClassroomAssigneeInfo
                            > = new Map();
                            for (const parsedAsgn of parsedAssignees) {
                              const oldAsgn = oldAssigneesMap.get(
                                parsedAsgn.id
                              );

                              if (
                                oldAsgn &&
                                EMAIL_REGEX.test(oldAsgn.email ?? "")
                              ) {
                                parsedAsgn.email = oldAsgn.email;
                                finalAssigneeList.push(parsedAsgn);
                              } else {
                                newAssigneesWithoutEmail.set(
                                  parsedAsgn.id,
                                  parsedAsgn
                                );
                              }
                            }

                            // --- NEW ASSIGNEES OR ASSIGNEES WITH INVALID EMAILS
                            // will need to fetch emails from webscraping (0.5 seconds per)
                            const numOfNewAssignees =
                              newAssigneesWithoutEmail.size;
                            if (!!numOfNewAssignees) {
                              const estSeconds =
                                Math.round(
                                  ((numOfNewAssignees *
                                    DROPDOWN_ANIMATION_DURATION_MS) /
                                    1000) *
                                    10
                                ) / 10; // rounded to nearest tenth
                              setDisabledMessage(
                                `You have ${numOfNewAssignees} student(s), so it should take about ${estSeconds} seconds.`
                              );
                            }
                            const newAssginees =
                              await updateAssigneesWithEmailFromPeoplesTab(
                                newAssigneesWithoutEmail
                              );
                            finalAssigneeList.push(...newAssginees);

                            // update assignees
                            await updateAssigneeList(db, finalAssigneeList);

                            // if there were any name changes, refresh those subgroups
                            // to get the updated names from DB
                            Array.from(
                              nameChangeTempSubgroupsMap.values()
                            ).forEach((tempSg) =>
                              tempSg.tempStore.setState((state) => ({
                                ...state,
                                tempAssigneeIds: [...state.tempAssigneeIds],
                              }))
                            );

                            // force re-render with sorted assignees
                            const assignees = await getAssigneeList(db);
                            invalidateAssigneeList(assignees);

                            setDisabledMessage(null);
                          }}
                        >
                          &#128260; Refresh List
                        </button>
                      </div>
                    </div>
                  )
                }
              </div>
              <div className="flex justify-end gap-4">
                {pageType !== GoogleClassroomState.HOME && (
                  <div className="modal-action">
                    <button
                      className={`btn ${
                        disabledMessage && "btn-disabled"
                      } btn-neutral`}
                      ref={saveTempSubgroupsButtonRef}
                    >
                      Save
                    </button>
                  </div>
                )}
                <div className="modal-action">
                  <button
                    className={`btn ${disabledMessage && "btn-disabled"}`}
                    ref={cancelChangesButtonRef}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-base mb-3">
                ACCESS DENIED! You must be a teacher to modify{" "}
                <b>{classroomName}</b> subgroups.
              </p>
              <div className="modal-action">
                <button className="btn">Cancel</button>
              </div>
            </>
          )}
        </form>
      </dialog>
    </DragDropContext>
  );
}
