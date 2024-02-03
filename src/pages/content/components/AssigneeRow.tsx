import { useEffect, useRef, useState } from "react";
import {
  EMAIL_REGEX,
  type GoogleClassroomAssigneeInfo,
} from "../../../gc-assignees";
import type { DraggableProvided } from "react-beautiful-dnd";
import { useMultiDragAssigneesStore } from "./_stores";
import { useAssigneeListStore } from "../../../gc-hooks";

type AssigneeRowProps = {
  assignee: GoogleClassroomAssigneeInfo;
  index: number;
  droppableId: string;
  provided?: DraggableProvided;
};

/**
 * Displays all information about an assignee. This is not draggable by itself,
 * so the parent container has to wrap it in a <Draggable /> container.
 * @param assignee
 * @param provided This is optional. Only use it if you need dragging features.
 */
export function AssigneeRow({
  assignee,
  index,
  droppableId,
  provided,
}: AssigneeRowProps) {
  const isValidEmail = EMAIL_REGEX.test(assignee.email ?? "");

  // this is used to execute add or delete, however it should not be used to style
  const [toggled, setToggled] = useState(false);

  const [
    selectedAssignees,
    currDroppableId,
    currentlyRefreshing,
    addAssignee,
    deleteAssignee,
  ] = useMultiDragAssigneesStore((state) => [
    state.selectedAssigneesIds,
    state.currDroppableId,
    state.currentlyRefreshing,
    state.addAssignee,
    state.deleteAssignee,
  ]);
  const isSelected =
    droppableId === currDroppableId && selectedAssignees.has(index); // instead, use this to cover cases such as "What if the user clicks outside?"

  const prevCheckboxRef = useRef<HTMLElement | null>(null);
  const nextCheckboxRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const { assigneeList } = useAssigneeListStore.getState();
    const maxIndex = assigneeList.length - 1;

    const prevIndex = index - 1;
    const prevCheckbox = document.getElementById(
      `checkbox-assigneeList-${prevIndex < 0 ? maxIndex : prevIndex}`
    );
    if (prevCheckbox) {
      prevCheckboxRef.current = prevCheckbox;
    }

    const nextIndex = index + 1;
    const nextCheckbox = document.getElementById(
      `checkbox-assigneeList-${nextIndex > maxIndex ? 0 : nextIndex}`
    );
    if (nextCheckbox) {
      nextCheckboxRef.current = nextCheckbox;
    }
  }, []); // use this so that we can continuously make sure we have ref to neighboring checkboxes

  useEffect(() => {
    if (!provided) return;
    if (isSelected === toggled) return; // prevent infinite loop

    if (!toggled) {
      deleteAssignee(index, droppableId);
    } else {
      addAssignee(index, assignee.id, droppableId);
    }

    // at this point, isSelected === toggled
  }, [toggled]);

  useEffect(() => {
    // if the user selects a different droppable id (or outside of the modal), we need to reset toggle
    if (isSelected !== toggled) {
      setToggled(isSelected);
    }
  }, [isSelected]);

  return (
    <li
      ref={provided?.innerRef}
      {...provided?.dragHandleProps}
      {...provided?.draggableProps}
      className={`flex flex-row items-center justify-between mt-[7px] p-3 ${
        !(isSelected ?? toggled) ? "bg-white" : "bg-gray-200"
      } rounded-lg shadow overflow-x-auto`}
    >
      <div className="flex flex-row w-full items-center">
        <div className="avatar mr-[10px]">
          <div className="w-9 h-9 rounded-full">
            <img src={assignee.pfpUrl} />
          </div>
        </div>
        <div>
          <p className="text-lg">
            {assignee.firstName} {assignee.lastName}
          </p>
          {isValidEmail && <p>{assignee.email}</p>}
          {!isValidEmail && (
            <div className="max-w-[70ch]">
              <p>There was an error obtaining the email. Try refreshing.</p>
              <details className="italic hover:cursor-pointer my-2 mx-1 p-2 bg-red-100 border border-red-300 rounded-sm">
                <summary>What is the error and what does it mean?</summary>
                <div>
                  <p>
                    Error Code:{" "}
                    {assignee.email && assignee.email.trim() !== ""
                      ? assignee.email
                      : "An unknown bug occured. Please contact support if it persists after refreshing."}
                  </p>
                  <p className="not-italic pt-3">
                    <b>
                      You can still put {assignee.firstName} {assignee.lastName}{" "}
                      into subgroups.{" "}
                    </b>
                    However, their email will be replaced by their Google
                    Classroom ID ({assignee.id}) upon exporting.
                  </p>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
      <input
        type="checkbox"
        id={`checkbox-assigneeList-${index}`}
        className="checkbox mr-2"
        disabled={currentlyRefreshing}
        checked={!currentlyRefreshing ? (isSelected ?? toggled) : false}
        onClick={(e) => {
          if (e.button !== 0) return;
          setToggled(!toggled);
        }}
        onKeyDown={(e) => {
          e.preventDefault();

          switch (e.key) {
            case "Enter":
              setToggled(!toggled);
              break;
            case "ArrowUp":
              // currCheckboxRef.current?.blur();
              console.log(prevCheckboxRef.current);
              prevCheckboxRef.current?.focus();
              break;
            case "ArrowDown":
              // currCheckboxRef.current?.blur();
              console.log(nextCheckboxRef.current);
              nextCheckboxRef.current?.focus();
              break;
          }
        }}
      />
    </li>
  );
}
