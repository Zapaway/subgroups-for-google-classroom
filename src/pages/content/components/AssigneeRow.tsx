import {
  EMAIL_REGEX,
  type GoogleClassroomAssigneeInfo,
} from "../../../gc-assignees";
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
  const isValidEmail = EMAIL_REGEX.test(assignee.email ?? "");

  return (
    <li
      ref={provided?.innerRef}
      {...provided?.dragHandleProps}
      {...provided?.draggableProps}
      className="flex flex-row items-center mt-[7px] p-3 bg-white rounded-lg shadow overflow-x-auto"
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
    </li>
  );
}
