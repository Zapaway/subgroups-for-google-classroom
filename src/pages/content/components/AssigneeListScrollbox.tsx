import { GoogleClassroomAssigneeInfo } from "../../../gc-assignees";
import { useAssigneeListStore, usePageInfoStore } from "../../../gc-hooks";
import { connectToDb, getAssigneeList } from "../../../gc-idb";
import { useEffect } from "react";
import { AssigneeRow } from "./AssigneeRow";
import { Draggable, Droppable } from "react-beautiful-dnd";

// allow ID-based reference to modal w/o having to execute a function
declare const window: Window &
  typeof globalThis & {
    subgroups_modal: HTMLDialogElement;
  };

/**
 * A scrollbox listing all assignees in the database.
 * Each assignee row is made draggable.
 * Although this scrollbox is wrapped in a droppable, the assignees cannot be rearranged in here.
 */
export function AssigneeListScrollbox() {
  const classroomID = usePageInfoStore((state) => state.classroomID);
  const [assigneeList, invalidateAssigneeList] = useAssigneeListStore(
    (state) => [state.assigneeList, state.invalidateAssigneeList]
  );

  // populate the assignee list initally
  useEffect(() => {
    (async () => {
      const db = await connectToDb(classroomID);
      const assignees = await getAssigneeList(db);
      invalidateAssigneeList(assignees);
    })();
  }, [classroomID]); // if we change classrooms, then we need to re-run this again

  return (
    <div className="overflow-y-scroll p-5 bg-slate-200">
      <p className="text-[14px]">
        This list contains <b>{assigneeList.length}</b> students.
      </p>
      <p>
        If you need to refresh the list, press the <b>Refresh List</b> button
        after going to the <b>People</b> tab and coming back here again.
      </p>

      <div className="bg-blue-200 rounded-md p-3 text-base my-3">&#128161; Use Ctrl+F to search for an assignee!</div>

      <Droppable
        droppableId="assigneeList"
        getContainerForClone={() => window.subgroups_modal}
        renderClone={(provided, snapshot, rubric) => (
          <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
          >
            <AssigneeRow assignee={assigneeList[rubric.source.index]} />
          </div>
        )}
      >
        {(provided) => (
          <ul {...provided.droppableProps} ref={provided.innerRef}>
            {assigneeList.map((a, index) => (
              <Draggable key={a.id} draggableId={a.id} index={index}>
                {(provided, snapshot) => (
                  <AssigneeRow assignee={a} provided={provided} />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </div>
  );
}
