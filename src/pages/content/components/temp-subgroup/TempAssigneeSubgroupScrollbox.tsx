import {
  GoogleClassroomSubgroupInfo,
  connectToDb,
  deleteSubgroup,
  getSubgroupList,
  updateSubgroup,
} from "../../../../gc-idb";
import { RefObject, useEffect, useState } from "react";
import { usePageInfoStore } from "../../../../gc-hooks";
import TempAssigneeSubgroup from "./TempAssigneeSubgroup";
import {
  GoogleClassroomTempSubgroupInfo,
  TempSubgroupId,
  TempSubgroupMap,
  didDbNameChange,
  didTempAssigneesChange,
  useTempSubgroupsStore,
} from "./stores";

/**
 * Allows response to certain button clicks outside of this scrollbox.
 * TODO Save should keep the temp subgroups
 * TODO Cancel shoudl remove any temp subgroups
 */
interface IAssigneeSubgroupScrollboxProps {
  addButtonRef: RefObject<HTMLButtonElement>;
  saveButtonRef: RefObject<HTMLButtonElement>;
  cancelButtonRef: RefObject<HTMLButtonElement>;
}

/**
 * A scrollbox listing all subgroups.
 * This parent container is not droppable, however each subgroup is droppable.
 * NOTE: All subgroups loaded in are temp and will not affect the database
 * until the "Save" button is pressed.
 */
export default function TempAssigneeSubgroupScrollbox({
  addButtonRef,
  saveButtonRef,
  cancelButtonRef,
}: IAssigneeSubgroupScrollboxProps) {
  const classroomID = usePageInfoStore((state) => state.classroomID);
  const [tempSubgroups, loadSubgroups, addTempSubgroup, refreshTempSubgroups] =
    useTempSubgroupsStore((state) => [
      state.tempSubgroups,
      state.loadSubgroups,
      state.addTempSubgroup,
      state.refreshTempSubgroups,
    ]);

  // to fix very early loading issues (if user clicks button too early)
  const [doneLoading, setDoneLoading] = useState(false);

  useEffect(() => {
    if (doneLoading) {
      refreshTempSubgroups();
    }
  }, [doneLoading]);

  // populate the subgroup list from db initally
  useEffect(() => {
    (async () => {
      setDoneLoading(false);

      const db = await connectToDb(classroomID);
      const dbSubgroups = await getSubgroupList(db);
      loadSubgroups(dbSubgroups);

      setDoneLoading(true);
    })();
  }, [classroomID]); // if we change classrooms, then we need to re-run this again

  // attach feature to add temp subgroups
  useEffect(() => {
    const addBtn = addButtonRef.current;
    if (addBtn) {
      addBtn.onclick = (e: MouseEvent) => {
        e.preventDefault();
        addTempSubgroup();
      };
    }
  }, [addButtonRef]);

  // attach feature to save temp subgroups to db
  useEffect(() => {
    const saveBtn = saveButtonRef.current;
    if (saveBtn) {
      saveBtn.onclick = async (e: MouseEvent) => {
        const currClassroomId = usePageInfoStore.getState().classroomID;
        const db = await connectToDb(currClassroomId);
        const oldExistingSubgroupNames = (await getSubgroupList(db)).map(
          (sg) => sg.subgroupName
        );
        const newSubgroups: GoogleClassroomSubgroupInfo[] = [];

        // needed as the "tempSubgroups" attached to button is stale
        const currTempSubgroups =
          useTempSubgroupsStore.getState().tempSubgroups;

        // go through each temp subgroup for changes
        for (const [_, tempInfo] of currTempSubgroups) {
          let newSubgroupInfo: GoogleClassroomSubgroupInfo;

          const tempStore = tempInfo.tempStore;
          const { tempSubgroupName, tempAssigneeIds } = tempStore.getState();

          // if newly added temp group, then add to db
          if (tempInfo.existsInDb === false) {
            await updateSubgroup(db, {
              subgroupName: tempSubgroupName,
              assigneeIds: [...tempAssigneeIds],
            });

            newSubgroupInfo = {
              ...tempInfo,
              subgroupName: tempSubgroupName,
              assigneeIds: [...tempAssigneeIds],
            };
          }
          // changes are made to existing db subgroup
          else {
            newSubgroupInfo = tempInfo;

            if (didDbNameChange(tempInfo)) {
              // make the tempSubgroupName permanent
              newSubgroupInfo = {
                ...tempInfo,
                subgroupName: tempSubgroupName,
              };
            }
            if (didTempAssigneesChange(tempInfo)) {
              // make the tempAssigneesIds permanent
              newSubgroupInfo = {
                ...tempInfo,
                assigneeIds: [...tempAssigneeIds],
              };
            }
            // if nothing changed, then everything would remain the same

            // if assignees only changed,
            //    then update existing subgroup
            // if subgroupName changed (doesn't matter if assignee was changed or not),
            //    then add new subgroup w/ updated info
            await updateSubgroup(db, {
              subgroupName: tempSubgroupName,
              assigneeIds: tempAssigneeIds,
            });
          }

          newSubgroups.push(newSubgroupInfo);
        }

        // remove any subgroups that were deleted from the scrollbox or those whose names
        // were edited
        // NOTE: covers case in which the user accidently deletes a subgroup and creates
        //       a new one with the same name
        const newSubgroupNames = new Set(
          newSubgroups.map((s) => s.subgroupName)
        );
        const subgroupNamesToDelete = oldExistingSubgroupNames.filter(
          (name) => !newSubgroupNames.has(name)
        );
        for (const oldName of subgroupNamesToDelete) {
          await deleteSubgroup(db, oldName);
        }

        // update temp subgroup (w/o making call from db)
        loadSubgroups(newSubgroups);
      };
    }
  }, [saveButtonRef]);

  // attach feature to cancel any changes made
  useEffect(() => {
    const cancelBtn = cancelButtonRef.current;
    if (cancelBtn) {
      cancelBtn.onclick = async () => {
        const currClassroomId = usePageInfoStore.getState().classroomID;
        const db = await connectToDb(currClassroomId);
        const dbSubgroups = await getSubgroupList(db);

        loadSubgroups(dbSubgroups);
        setDoneLoading(true);
      };
    }
  }, [cancelButtonRef]);

  return (
    <div className="overflow-y-scroll p-5 bg-slate-200">
      {doneLoading ? (
        !!tempSubgroups.size ? (
          Array.from(tempSubgroups.keys()).map((tempSubgroupId) => {
            return (
              <TempAssigneeSubgroup
                key={tempSubgroupId}
                tempSubgroupId={tempSubgroupId}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-xl">
              You currently have no subgroups for this class.
            </p>
            <p className="text-sm">
              Click on "&#10133; Add Subgroup" to get started!
            </p>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <span className="loading loading-spinner loading-lg"></span>
          Loading...
        </div>
      )}
    </div>
  );
}
