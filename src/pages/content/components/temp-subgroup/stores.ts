import { StoreApi, UseBoundStore, create } from "zustand";
import {
  GoogleClassroomSubgroupInfo,
  connectToDb,
  deleteSubgroup,
  getSubgroupList,
  updateSubgroup,
} from "../../../../gc-idb";
import { usePageInfoStore, useSubgroupListStore } from "../../../../gc-hooks";

type TempSubgroupStore = UseBoundStore<StoreApi<ITempSubgroupStoreState>>;
export type TempSubgroupId = string;
export type TempSubgroupMap = Map<
  TempSubgroupId,
  GoogleClassroomTempSubgroupInfo
>;

/**
 * Provides a Zustand store to include all temp info.
 */
export type GoogleClassroomTempSubgroupInfo = GoogleClassroomSubgroupInfo & {
  tempStore: TempSubgroupStore;
} & (
    | {
        subgroupName: string;
        existsInDb: true;
      }
    | {
        subgroupName: "temp";
        existsInDb: false;
      }
  );

export function didDbNameChange({
  existsInDb,
  subgroupName,
  tempStore,
}: GoogleClassroomTempSubgroupInfo) {
  if (existsInDb === false) return true;
  return !(subgroupName === tempStore.getState().tempSubgroupName);
}

export function didTempAssigneesChange({
  assigneeIds,
  tempStore,
}: GoogleClassroomTempSubgroupInfo) {
  const tempAssigneeIds = tempStore.getState().tempAssigneeIds;

  const dbAssigneeIdsSet = new Set(assigneeIds);
  const tempAssigneeIdsSet = new Set(tempAssigneeIds);

  const dbMinusTemp = new Set(
    [...dbAssigneeIdsSet].filter((a) => !tempAssigneeIdsSet.has(a))
  );
  const tempMinusDb = new Set(
    [...tempAssigneeIdsSet].filter((a) => !dbAssigneeIdsSet.has(a))
  );

  // check if there are any differences
  return !!dbMinusTemp.size || !!tempMinusDb.size;
}

interface INewTempSubgroupsStoreState {
  tempSubgroups: TempSubgroupMap;

  /**
   * Load in subgroups from the database.
   *
   * **NOTE: This overwrites the temp subgroup list.**
   * @param subgroups
   */
  loadSubgroups: (subgroups: GoogleClassroomSubgroupInfo[]) => void;

  refreshTempSubgroups: () => void;
  deleteAssgineeFromAllTempSubgroups: (assigneeId: string) => void;
  getTempSubgroup: (tempSubgroupId: string) => GoogleClassroomTempSubgroupInfo;
  getAllTempSubgroupsBasedOn: (
    assigneeId: string
  ) => GoogleClassroomTempSubgroupInfo[];
  addTempSubgroup: () => void;
  delTempSubgroup: (tempSubgroupId: string) => void;
  delAllTempSubgroups: () => void;
}

/**
 * Track all changes to temp subgroups, and gives access to each temp subgroup's state.
 * This can include DB subgroups, which are loaded in upon request.
 *
 * Do not mix up `tempSubgroupId` with `tempSubgroupName`. `tempSubgroupId` and
 * `tempSubgroupName` can be the name of a DB subgroup or newly created subgroup.
 * However, if there are changes made to the temp subgroup's name, use `tempSubgroupName`.
 *  - `tempSubgroupName` is used for display purposes
 *  - `tempSubgroupId` is used for tracking and db purposes
 */
export const useTempSubgroupsStore = create<INewTempSubgroupsStoreState>(
  (set, get) => ({
    tempSubgroups: new Map(),
    loadSubgroups: (subgroups) => {
      const oldSubgroupIds = Array.from(get().tempSubgroups.keys());
      oldSubgroupIds.map((id) => get().delTempSubgroup(id));

      // also update subgroup store for dropdown
      useSubgroupListStore.setState({
        subgroupList: [...subgroups],
      });

      for (const sg of subgroups) {
        const tempId = sg.subgroupName;
        const tempStore = createTempSubgroupStore(sg, sg.subgroupName);

        get().tempSubgroups.set(tempId, { ...sg, tempStore, existsInDb: true });
      }
    },
    refreshTempSubgroups: () => {
      set({ tempSubgroups: new Map(get().tempSubgroups) });
    },
    deleteAssgineeFromAllTempSubgroups: (assigneeId) => {
      for (const [tempId, tempInfo] of get().tempSubgroups) {
        const newDbAssigneeIds = tempInfo.assigneeIds.filter(
          (id) => id !== assigneeId
        );
        tempInfo.tempStore.setState((state) => ({
          ...state,
          tempAssigneeIds: state.tempAssigneeIds.filter(
            (tempId) => tempId !== assigneeId
          ),
        }));

        // we don't want to trigger an update, since we already set state for each
        // subgroup via setState
        get().tempSubgroups.set(tempId, {
          ...tempInfo,
          assigneeIds: newDbAssigneeIds,
        });
      }
    },
    getTempSubgroup: (tempSubgroupId) =>
      get().tempSubgroups.get(tempSubgroupId)!,
    getAllTempSubgroupsBasedOn: (assigneeId) => {
      const allTempInfo = Array.from(get().tempSubgroups.values());

      // get temp subgroup if assignee id is in the temp assignee list
      return allTempInfo.filter((info) =>
        info.tempStore.getState().tempAssigneeIds.includes(assigneeId)
      );
    },
    addTempSubgroup: () => {
      const currTempSubgroups = get().tempSubgroups;
      let genericTempIdNum = 1;
      let genericTempId = "";
      let isGenericTempIdTaken = true;

      const existingTempIds = Array.from(currTempSubgroups.keys());

      // will run at least once
      while (isGenericTempIdTaken) {
        genericTempId = `Subgroup ${genericTempIdNum}`;

        // if already taken, increment number and repeat
        if (existingTempIds.includes(genericTempId)) {
          genericTempIdNum++;
          continue;
        }

        // if not, add it to stop loop
        existingTempIds.push(genericTempId);
        break;
      }

      // create new temp subgroup
      const newTempSubgroupBase: GoogleClassroomSubgroupInfo = {
        subgroupName: "temp",
        assigneeIds: [],
      };
      const newTempSubgroup: GoogleClassroomTempSubgroupInfo = {
        ...newTempSubgroupBase,
        subgroupName: "temp",
        existsInDb: false,
        tempStore: createTempSubgroupStore(newTempSubgroupBase, genericTempId),
      };

      // update the state to include the generic temp id and subgroup info
      set({
        tempSubgroups: new Map(currTempSubgroups).set(
          genericTempId,
          newTempSubgroup
        ),
      });
    },
    delTempSubgroup: (tempSubgroupId) => {
      const newTempSubgroups = new Map(get().tempSubgroups);
      newTempSubgroups.delete(tempSubgroupId);

      set({ tempSubgroups: newTempSubgroups });
    },
    delAllTempSubgroups: () => {
      set({ tempSubgroups: new Map() });
    },
  })
);

interface ITempSubgroupStoreState {
  tempSubgroupName: string;
  tempAssigneeIds: string[];
  isExpanded?: boolean; // if undefined, then it will be set to false; else it will maintain value
  isEditingSubgroupName?: boolean; // undefined = false
  errorMessage: string | null;

  setTempSubgroupName: (tempSubgroupName: string) => void;
  setIsExpanded: (isExpanded: boolean) => void;
  setIsEditingSubgroupName: (isEditingGroupName: boolean) => void;
  setErrorMessage: (errorMessage: string | null) => void;
}

/**
 * Make a store for a temporary subgroup so that components can change its state.
 * @param subgroup The subgroup to create the store for.
 * @returns A temporary subgroup's store.
 */
function createTempSubgroupStore(
  subgroup: GoogleClassroomSubgroupInfo,
  tempSubgroupName: string
) {
  return create<ITempSubgroupStoreState>((set) => ({
    tempSubgroupName,
    tempAssigneeIds: [...subgroup.assigneeIds],
    errorMessage: null,

    setTempSubgroupName: (tempSubgroupName) => set({ tempSubgroupName }),
    setIsExpanded: (isExpanded) => set({ isExpanded }),
    setIsEditingSubgroupName: (isEditingGroupName) =>
      set({ isEditingSubgroupName: isEditingGroupName }),
    setErrorMessage: (errorMessage) => set({ errorMessage }),
  }));
}
