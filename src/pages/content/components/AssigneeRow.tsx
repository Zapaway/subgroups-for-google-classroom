import { useEffect, useState } from "react";
import {
  EMAIL_REGEX,
  type GoogleClassroomAssigneeInfo,
} from "../../../gc-assignees";
import type { DraggableProvided } from "react-beautiful-dnd";
import { useMultiDragAssigneesStore } from "./_stores";

interface IAssigneeRowProps {
  assignee: GoogleClassroomAssigneeInfo;
  index: number;
  droppableId: string;
  provided?: DraggableProvided;
}

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
}: IAssigneeRowProps) {
  const isValidEmail = EMAIL_REGEX.test(assignee.email ?? "");

  // this is used to execute add or delete, however it should not be used to style
  const [toggled, setToggled] = useState(false);

  const [selectedAssignees, currDroppableId, addAssignee, deleteAssignee] =
    useMultiDragAssigneesStore((state) => [
      state.selectedAssigneesIds,
      state.currDroppableId,
      state.addAssignee,
      state.deleteAssignee,
    ]);
  const isSelected =
    (provided &&
      droppableId === currDroppableId &&
      selectedAssignees.has(index)) ??
    true; // instead, use this to cover cases such as "What if the user clicks outside?"

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
        !isSelected ? "bg-white" : "bg-gray-200"
      } rounded-lg shadow overflow-x-auto`}
      onClick={(e) => {
        if (e.button !== 0) return;
        setToggled(!toggled);
      }}
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
              <p>There was an error finding the email. Try refreshing.</p>
              <p className="italic">
                <b>
                  You can still put {assignee.firstName} {assignee.lastName} into
                  subgroups.{" "}
                </b>
                However, their email will be replaced by their Google Classroom ID
                ({assignee.id}) upon exporting.
              </p>
              <details className="italic hover:cursor-pointer my-2 mx-1 p-2 bg-red-100 border border-red-300 rounded-sm">
                <summary>What is the error?</summary>
                <p>
                  {(assignee.email && assignee.email !== "") ??
                    "An unknown bug occured. Please contact support if it persists after refreshing."}
                </p>
              </details>
            </div>
          )}
        </div>
      </div>
        <input type="checkbox" className="checkbox" checked={isSelected} />
    </li>
  );
}
