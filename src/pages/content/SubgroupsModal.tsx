import {
  useAssigneeListStore,
  useGoogleClassroomNameStore,
  usePageInfoStore,
  useUserTypeStore,
} from "../../gc-hooks";
import { GoogleClassroomState } from "../../gc-page-info";
import { getAllAssigneesFromPeopleTab } from "../../gc-assignees";
import {
  GoogleClassroomSubgroupInfo,
  connectToDb,
  deleteAssignee,
  getAssigneeList,
  updateAssigneeList,
} from "../../gc-idb";
import { AssigneeListScrollbox } from "./components/AssigneeListScrollbox";
import { DragDropContext } from "react-beautiful-dnd";
import TempAssigneeSubgroupScrollbox from "./components/temp-subgroup/TempAssigneeSubgroupScrollbox";
import { useRef } from "react";
import {
  TempSubgroupMap,
  useTempSubgroupsStore,
} from "./components/temp-subgroup/stores";
// import stepOneImg from "../../assets/img/step1cropped.webp";
// import stepTwoImg from "../../assets/img/step2cropped.webp";
// import stepThreeImg from "../../assets/img/step3cropped.webp";

export default function SubgroupsModal() {
  // info
  const [pageType, classroomID] = usePageInfoStore((state) => [
    state.pageType,
    state.classroomID,
  ]);
  const classroomName = useGoogleClassroomNameStore(
    (state) => state.classroomName
  );
  const isTeacher = useUserTypeStore((state) => state.isTeacher);

  // button refs
  const addTempSubgroupButtonRef = useRef<HTMLButtonElement>(null);
  const saveTempSubgroupsButtonRef = useRef<HTMLButtonElement>(null);
  const cancelChangesButtonRef = useRef<HTMLButtonElement>(null);

  // invalidatation functions
  const invalidateAssigneeList = useAssigneeListStore(
    (state) => state.invalidateAssigneeList
  );
  const deleteAssgineeFromAllTempSubgroups = useTempSubgroupsStore(
    (state) => state.deleteAssgineeFromAllTempSubgroups
  );

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
          <h3 className="font-bold text-xl">Subgroups for {classroomName}</h3>
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
                    <p className="text-base mb-3">
                      This is where you can add, edit, and remove subgroups for{" "}
                      <b>{classroomName}</b>! Please note that there are some caveats.
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
                      <i>
                        If you encounter any bugs, please report it through the
                        "Support" section in the Chrome Extension store.
                      </i>
                    </p>
                    <div className="grid grid-cols-2 gap-4 w-full h-96">
                      <TempAssigneeSubgroupScrollbox
                        addButtonRef={addTempSubgroupButtonRef}
                        saveButtonRef={saveTempSubgroupsButtonRef}
                        cancelButtonRef={cancelChangesButtonRef}
                      />
                      <AssigneeListScrollbox />
                    </div>
                  </div>
                )
              }
              <div className="mt-2 flex justify-between">
                {
                  // only allow adding subgroups on individual GC pages
                  pageType !== GoogleClassroomState.HOME && (
                    <button
                      className="btn btn-xs"
                      ref={addTempSubgroupButtonRef}
                      onClick={(e) => {
                        // this is safe guard in case ref was not set yet
                        e.preventDefault();
                      }}
                    >
                      &#10133; Add Subgroup
                    </button>
                  )
                }
                {
                  // only show refresh list option if user is on "people" tab
                  pageType === GoogleClassroomState.PEOPLE && (
                    <button
                      className="btn btn-xs"
                      onClick={async (e) => {
                        e.preventDefault();

                        const db = await connectToDb(classroomID);
                        const oldAssignees = await getAssigneeList(db);
                        const newAssignees = getAllAssigneesFromPeopleTab();
                        const newAssigneesIds = new Set(
                          newAssignees.map((a) => a.id)
                        );
                        const newAssigneesMap = new Map(
                          newAssignees.map((a) => [a.id, a])
                        );
                        const nameChangeTempSubgroupsMap: TempSubgroupMap =
                          new Map();

                        // if the new assignee list doesn't contain the db assignee,
                        // it needs to be deleted
                        await Promise.all(
                          oldAssignees.map(
                            async ({ id, firstName, lastName }) => {
                              if (!newAssigneesIds.has(id)) {
                                await deleteAssignee(db, id);
                                deleteAssgineeFromAllTempSubgroups(id);
                              } else {
                                const {
                                  firstName: newFirstName,
                                  lastName: newLastName,
                                } = newAssigneesMap.get(id)!;
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

                        // update assignees
                        await updateAssigneeList(db, newAssignees);

                        // if there were any name changes, refresh those subgroups
                        // to get the updated names from DB
                        Array.from(nameChangeTempSubgroupsMap.values()).forEach(
                          (tempSg) =>
                            tempSg.tempStore.setState((state) => ({
                              ...state,
                              tempAssigneeIds: [...state.tempAssigneeIds],
                            }))
                        );

                        // force re-render with sorted assignees
                        const assignees = await getAssigneeList(db);
                        invalidateAssigneeList(assignees);
                      }}
                    >
                      &#128260; Refresh List
                    </button>
                  )
                }
              </div>
              <div className="flex justify-end gap-4">
                {pageType !== GoogleClassroomState.HOME && (
                  <div className="modal-action">
                    <button className="btn" ref={saveTempSubgroupsButtonRef}>
                      Save
                    </button>
                  </div>
                )}
                <div className="modal-action">
                  <button className="btn" ref={cancelChangesButtonRef}>
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-base mb-3">
                ACCESS DENIED! You must be a teacher to modify <b>{classroomName}</b> subgroups.
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
