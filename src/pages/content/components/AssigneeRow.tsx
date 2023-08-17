import type { GoogleClassroomAssigneeInfo } from "../../../gc-assignees";
import type { DraggableProvided } from "react-beautiful-dnd";

interface IAssigneeRowProps {
  assignee: GoogleClassroomAssigneeInfo;
  provided?: DraggableProvided;
}

/**
 * Displays all information about an assignee. This is not draggable by itself,
 * so the parent container has to wrap it in a <Draggable /> container.
 * @param assignee
 * @param provided This is optional. Only use it if you need dragging features.
 */
export function AssigneeRow({ assignee, provided }: IAssigneeRowProps) {
  return (
    <li
      ref={provided?.innerRef}
      {...provided?.dragHandleProps}
      {...provided?.draggableProps}
      className="flex flex-row items-center mt-[7px] p-3 bg-white rounded-lg shadow"
    >
      <div className="avatar mr-[10px]">
        <div className="w-9 rounded-full">
          <img src={assignee.pfpUrl} />
        </div>
      </div>
      <div>
        <p className="text-lg">
          {assignee.firstName} {assignee.lastName}
        </p>
        <p>
          {assignee.email}
        </p>
      </div>
    </li>
  );
}