import {
  GoogleClassroomSubgroupInfo,
  connectToDb,
  deleteSubgroup,
  getSubgroupList,
  updateSubgroup,
} from "../../../../gc-idb";
import { RefObject, useEffect, useState } from "react";
import {
  useGoogleClassroomNameStore,
  usePageInfoStore,
} from "../../../../gc-hooks";
import TempAssigneeSubgroup from "./TempAssigneeSubgroup";
import {
  didDbNameChange,
  didTempAssigneesChange,
  useTempSubgroupsStore,
} from "./_stores";
import { generateTempSubgroupsCSVUrl } from "./_export";
import { type RequestOptions } from "../../../background";

// allow ID-based reference to modal w/o having to execute a function
declare const window: Window &
  typeof globalThis & {
    import_modal: HTMLDialogElement;
  };

/**
 * Allows response to certain button clicks outside of this scrollbox.
 */
interface IAssigneeSubgroupScrollboxProps {
  addButtonRef: RefObject<HTMLButtonElement>;
  importButtonRef: RefObject<HTMLButtonElement>;
  exportButtonRef: RefObject<HTMLButtonElement>;
  clearButtonRef: RefObject<HTMLButtonElement>;
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
  importButtonRef,
  exportButtonRef,
  clearButtonRef,
  saveButtonRef,
  cancelButtonRef,
}: IAssigneeSubgroupScrollboxProps) {
  const classroomID = usePageInfoStore((state) => state.classroomId);
  const [
    tempSubgroups,
    doneInitLoading,
    loadSubgroups,
    setDoneInitLoading,
    addTempSubgroup,
    refreshTempSubgroups,
    delAllTempSubgroups,
  ] = useTempSubgroupsStore((state) => [
    state.tempSubgroups,
    state.doneInitLoading,
    state.loadSubgroups,
    state.setDoneInitLoading,
    state.addTempSubgroup,
    state.refreshTempSubgroups,
    state.delAllTempSubgroups,
  ]);

  // to fix very early loading issues (if user clicks button too early)
  useEffect(() => {
    if (doneInitLoading) {
      refreshTempSubgroups();
    }
  }, [doneInitLoading]);

  // populate the subgroup list from db initally
  useEffect(() => {
    (async () => {
      setDoneInitLoading(false);

      const db = await connectToDb(classroomID);
      const dbSubgroups = await getSubgroupList(db);
      loadSubgroups(dbSubgroups);

      setDoneInitLoading(true);
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

  // attach feature to import temp subgroups
  useEffect(() => {
    const importBtn = importButtonRef.current;
    if (importBtn) {
      importBtn.onclick = (e: MouseEvent) => {
        e.preventDefault();

        window.import_modal.showModal();
      };
    }
  }, [importButtonRef]);

  // attach feature to export temp subgroups
  useEffect(() => {
    const exportButton = exportButtonRef.current;
    if (exportButton) {
      exportButton.onclick = async (e: MouseEvent) => {
        e.preventDefault();

        const currClassroomId = usePageInfoStore.getState().classroomId;
        const tempSubgroups = Array.from(
          useTempSubgroupsStore.getState().tempSubgroups.values()
        );
        const url = await generateTempSubgroupsCSVUrl(
          tempSubgroups,
          currClassroomId
        );

        const classroomName =
          useGoogleClassroomNameStore.getState().classroomName;

        await chrome.runtime.sendMessage<RequestOptions>({
          type: "export",
          url,
          classroomName,
        });
      };
    }
  }, [exportButtonRef]);

  // attach feature to clear all temp subgroups
  useEffect(() => {
    const clearBtn = clearButtonRef.current;
    if (clearBtn) {
      clearBtn.onclick = (e: MouseEvent) => {
        e.preventDefault();
        delAllTempSubgroups();
      };
    }
  }, [clearButtonRef]);

  // attach feature to save temp subgroups to db
  useEffect(() => {
    const saveBtn = saveButtonRef.current;
    if (saveBtn) {
      saveBtn.onclick = async (e: MouseEvent) => {
        const currClassroomId = usePageInfoStore.getState().classroomId;
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
            console.log("temp", tempInfo);

            if (didDbNameChange(tempInfo)) {
              // make the tempSubgroupName permanent
              newSubgroupInfo = {
                ...newSubgroupInfo,
                subgroupName: tempSubgroupName,
              };
            }
            if (didTempAssigneesChange(tempInfo)) {
              console.log("CHANGEDDDD");
              // make the tempAssigneesIds permanent
              newSubgroupInfo = {
                ...newSubgroupInfo,
                assigneeIds: [...tempAssigneeIds],
              };
            }
            // if nothing changed, then everything would remain the same

            // if assignees only changed,
            //    then update existing subgroup
            // if subgroupName changed (doesn't matter if assignee was changed or not),
            //    then add new subgroup w/ updated info
            console.log("assignees", tempAssigneeIds);
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

        console.log("new (before)", newSubgroups);
        // update temp subgroup (w/o making call from db)
        loadSubgroups(newSubgroups);
        console.log("new (after load)", newSubgroups);
      };
    }
  }, [saveButtonRef]);

  // attach feature to cancel any changes made
  useEffect(() => {
    const cancelBtn = cancelButtonRef.current;
    if (cancelBtn) {
      cancelBtn.onclick = async () => {
        const currClassroomId = usePageInfoStore.getState().classroomId;
        const db = await connectToDb(currClassroomId);
        const dbSubgroups = await getSubgroupList(db);

        loadSubgroups(dbSubgroups);
        setDoneInitLoading(true);
      };
    }
  }, [cancelButtonRef]);

  return (
    <div className="overflow-y-scroll p-5 bg-slate-200">
      {doneInitLoading ? (
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
