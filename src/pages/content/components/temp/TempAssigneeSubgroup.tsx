import { usePageInfoStore } from "../../../../gc-hooks";
import type { GoogleClassroomAssigneeInfo } from "../../../../gc-assignees";
import { useEffect, useRef, useState } from "react";
import { useTempSubgroupsStore } from "./_stores";
import { connectToDb, getAssignee } from "../../../../gc-idb";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { AssigneeRow } from "../AssigneeRow";
import { useMultiDragAssigneesStore } from "../_stores";

// allow ID-based reference to modal w/o having to execute a function
declare const window: Window &
  typeof globalThis & {
    subgroups_modal: HTMLDialogElement;
  };

export const SUBGROUP_NAME_REGEX = /^[\w\-\_\s]+$/;  // can only contain alphanumeric, whitespace, -, and _ characters

interface ITempAssigneeSubgroupProps {
  tempSubgroupId: string;
}

/**
 * A modifiable subgroup.
 * @param tempSubgroupId ID associated to its location in subgroup store.
 */
export default function TempAssigneeSubgroup({
  tempSubgroupId,
}: ITempAssigneeSubgroupProps) {
  // personal store
  const useOwnStore = useTempSubgroupsStore
    .getState()
    .getTempSubgroup(tempSubgroupId).tempStore;
  const [
    tempSubgroupName,
    tempAssigneeIds,
    isExpanded,
    isEditingSubgroupName,
    errorMessage,

    setTempSubgroupName,
    setIsExpanded,
    setIsEditingSubgroupName,
    setErrorMessage,
  ] = useOwnStore((state) => [
    state.tempSubgroupName,
    state.tempAssigneeIds,
    state.isExpanded,
    state.isEditingSubgroupName,
    state.errorMessage,

    state.setTempSubgroupName,
    state.setIsExpanded,
    state.setIsEditingSubgroupName,
    state.setErrorMessage,
  ]);

  // display states
  const [assignees, setAssignees] = useState<GoogleClassroomAssigneeInfo[]>([]);
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const subgroupNameTextInputRef = useRef<HTMLInputElement>(null);
  const currentlyRefreshing = useMultiDragAssigneesStore(state => state.currentlyRefreshing);

  // external store/state
  const selfDelete = useTempSubgroupsStore((state) => state.delTempSubgroup);
  const classroomId = usePageInfoStore((state) => state.classroomId);

  // accept/cancel changes to subgroup name
  const acceptNameChange = () => {
    window.subgroups_modal.focus(); // allows preventDefault() to work

    const newTempName = subgroupNameTextInputRef.current?.value.trim();

    // make sure name is not taken and not empty
    if (!newTempName || newTempName === "") {
      setErrorMessage("Please provide a subgroup name.");
      subgroupNameTextInputRef.current?.focus();
      return;
    }

    // cannot risk duplicate droppable ids
    if (newTempName.trim().toLowerCase() === "assigneelist") {
      setErrorMessage("You cannot use this name. Use a different one.");
      subgroupNameTextInputRef.current?.focus();
      return;
    }

    // make sure it contains valid chars
    if (!SUBGROUP_NAME_REGEX.test(newTempName)) {
      setErrorMessage("Subgroup names can only contain alphabets, numbers, spaces, dashes, and underscores.");
      subgroupNameTextInputRef.current?.focus();
      return;
    }

    // make sure not the same as before
    // NOTE:  just stop editing since it isn't going to affect other
    //        temp names if accepted
    if (newTempName === tempSubgroupName) {
      setIsEditingSubgroupName(false);
      return;
    }

    // make sure not taken (others)
    const tempSubgroups = useTempSubgroupsStore.getState().tempSubgroups;
    const filteredTempSubgroups = new Map(
      [...tempSubgroups].filter(([id, _]) => id !== tempSubgroupId)
    );
    const filteredTempSubgroupsInfo = Array.from(
      filteredTempSubgroups.values()
    );
    const existingTempNames = filteredTempSubgroupsInfo.map(
      (sg) => sg.tempStore.getState().tempSubgroupName
    );
    if (existingTempNames.includes(newTempName)) {
      setErrorMessage("Subgroup name is taken.");
      subgroupNameTextInputRef.current?.focus();
      return;
    }

    // now change name (not id, since id will be changed on save)
    setTempSubgroupName(newTempName);
    setErrorMessage(null);
    setIsEditingSubgroupName(false);
  };
  const cancelNameChange = () => {
    window.subgroups_modal.focus(); // allows preventDefault() to work

    setIsEditingSubgroupName(false);
  };

  // load in assignees from id list
  useEffect(() => {
    (async () => {
      const db = await connectToDb(classroomId);
      const potentialAssignees = await Promise.all(
        tempAssigneeIds.map((id) => getAssignee(db, id))
      );
      const assignees = potentialAssignees.filter(
        (a): a is GoogleClassroomAssigneeInfo => !!a
      );

      setAssignees(assignees);
    })();
  }, [classroomId, tempAssigneeIds]);

  // display error message (if exists) for 5 seconds
  useEffect(() => {
    if (!errorMessage) return;

    const interval = setInterval(() => {
      setErrorMessage(null);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [errorMessage]);

  return (
    <details
      open={isExpanded}
      ref={dropdownRef}
      onToggle={() => {
        setIsExpanded(dropdownRef.current?.open ?? false);
      }}
      onKeyUp={(e) => {
        switch (e.key) {
          case "Enter":
            // input submission handled by its onSubmit listner
            e.preventDefault();
            break;
          case " ":
            if (isEditingSubgroupName) {
              e.preventDefault();
            }
            break;
          case "Escape":
            e.preventDefault();

            if (isEditingSubgroupName) {
              cancelNameChange();
            }
            break;
        }
      }}
      className={`${!errorMessage ? "bg-slate-300" : "bg-red-300"} rounded-box`}
    >
      <summary
        className={`${
          !errorMessage ? "bg-slate-300" : "bg-red-300"
        } py-2 px-5 text-lg font-bold w-full rounded-box cursor-pointer inline-block`}
        onKeyUp={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
          }
        }}
      >
        <div className="flex flex-row items-center justify-between" autoFocus>
          {
            // if editing, show textbox
            // if not, then show the current subgroup name
            isEditingSubgroupName ? (
              <div className="flex flex-row gap-2 w-full">
                <p>{isExpanded ? "⬇️" : "➡️"}</p>
                <input
                  type="text"
                  defaultValue={tempSubgroupName}
                  className="input input-sm w-full max-w-xs"
                  ref={subgroupNameTextInputRef}
                  autoFocus
                  onSubmit={(e) => {
                    e.preventDefault();
                    acceptNameChange();
                  }}
                />
              </div>
            ) : (
              `${isExpanded ? "⬇️" : "➡️"} ${tempSubgroupName}`
            )
          }
          <div className="hidden sm:flex items-center gap-1">
            {isEditingSubgroupName ? (
              // display accept or decline icons
              <>
                <button
                  className="btn btn-circle btn-sm btn-success"
                  onClick={(e) => {
                    e.preventDefault();
                    acceptNameChange();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20"
                    viewBox="0 -960 960 960"
                    width="20"
                  >
                    <path d="M378-246 154-470l43-43 181 181 384-384 43 43-427 427Z" />
                  </svg>
                </button>
                <button
                  className="btn btn-circle btn-sm btn-error"
                  onClick={(e) => {
                    e.preventDefault();
                    cancelNameChange();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20"
                    viewBox="0 -960 960 960"
                    width="20"
                  >
                    <path d="m249-207-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z" />
                  </svg>
                </button>
              </>
            ) : (
              // show the editing and trash icon
              <>
                <button
                  className="btn btn-circle btn-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditingSubgroupName(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20"
                    viewBox="0 -960 960 960"
                    width="20"
                  >
                    <path d="M794-666 666-794l42-42q17-17 42.5-16.5T793-835l43 43q17 17 17 42t-17 42l-42 42Zm-42 42L248-120H120v-128l504-504 128 128Z" />
                  </svg>
                </button>
                <button
                  className="btn btn-circle btn-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    window.subgroups_modal.focus(); // allows preventDefault() to work
                    selfDelete(tempSubgroupId);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20"
                    viewBox="0 -960 960 960"
                    width="20"
                  >
                    <path d="M261-120q-24 0-42-18t-18-42v-570h-41v-60h188v-30h264v30h188v60h-41v570q0 24-18 42t-42 18H261Zm106-146h60v-399h-60v399Zm166 0h60v-399h-60v399Z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
        {errorMessage && (
          <p className="mt-2 text-sm font-medium">{errorMessage}</p>
        )}
      </summary>
      <Droppable
        droppableId={tempSubgroupId}
        isDropDisabled={!isExpanded || currentlyRefreshing}
        getContainerForClone={() => window.subgroups_modal}
        renderClone={(provided, snapshot, rubric) => (
          <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
          >
            <AssigneeRow assignee={assignees[rubric.source.index]} index={rubric.source.index} droppableId={tempSubgroupId}/>
          </div>
        )}
      >
        {(provided, snapshot) => {
          return (
            <div
              className={`p-2 shadow rounded-lg w-full min-h-[84px] flex-grow ${
                snapshot.isDraggingOver
                  ? "bg-blue-200"
                  : !errorMessage
                  ? "bg-slate-400"
                  : "bg-red-400"
              }`}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {!!assignees.length ? (
                <ul className="mb-[7px]">
                  {assignees.map((a, index) => {
                    // prevent colliding ID names
                    const newId = `${tempSubgroupId}-${a.id}`;

                    return (
                      <Draggable key={newId} draggableId={newId} index={index}>
                        {(provided, snapshot) => (
                          <AssigneeRow assignee={a} index={index} droppableId={tempSubgroupId} provided={provided} />
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[84px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="48"
                    viewBox="0 -960 960 960"
                    width="48"
                  >
                    <path d="M180-120q-24.75 0-42.375-17.625T120-180v-440q0-24.75 17.625-42.375T180-680h210v60H180v440h600v-440H570v-60h210q24.75 0 42.375 17.625T840-620v440q0 24.75-17.625 42.375T780-120H180Zm300-203L318-485l43-43 89 89v-521h60v521l89-89 43 43-162 162Z" />
                  </svg>
                  Start adding your assignees here!
                </div>
              )}
            </div>
          );
        }}
      </Droppable>
    </details>
  );
}
