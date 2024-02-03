import { GoogleClassroomAssigneeInfo } from "@src/gc-assignees";
import { create } from "zustand";

type Index = number;
type EnableMultiDragAfterRefreshing = () => void;

type MultiDragAssigneesStoreStateData = {
  currDroppableId: string | null; // ensures that we are dragging elements from the same droppable
  selectedAssigneesIds: Map<Index, string>;
  fromIndex: number;
  toIndex: number;
  currentlyRefreshing: boolean;
};
const getDefaultMultiDragAssigneesStoreStateData = () =>
  ({
    currDroppableId: null,
    selectedAssigneesIds: new Map(),
    fromIndex: -1,
    toIndex: -1,
    currentlyRefreshing: false,
  } as MultiDragAssigneesStoreStateData);

type MultiDragAssigneesStoreStateFunc = {
  addAssignee: (
    index: Index,
    info: string,
    selectedDroppableId: string
  ) => void;
  deleteAssignee: (index: Index, selectedDroppableId: string) => void;
  disableMultiDragWhileRefreshing: () => EnableMultiDragAfterRefreshing;
  reset: () => void;
};

export const useMultiDragAssigneesStore = create<
  MultiDragAssigneesStoreStateData & MultiDragAssigneesStoreStateFunc
>((set, get) => ({
  ...getDefaultMultiDragAssigneesStoreStateData(),
  addAssignee: (index, id, selectedDroppableId) => {
    const { selectedAssigneesIds: selectedAssignees, currDroppableId } = get();

    if (selectedDroppableId !== currDroppableId) {
      selectedAssignees.clear();
    }

    selectedAssignees.set(index, id);

    set({
      selectedAssigneesIds: selectedAssignees,
      currDroppableId: selectedDroppableId,
    });
  },
  deleteAssignee: (index, selectedDroppableId) => {
    const { selectedAssigneesIds: selectedAssignees, currDroppableId } = get();

    if (selectedDroppableId !== currDroppableId) {
      selectedAssignees.clear();
    } else {
      selectedAssignees.delete(index);
    }

    set({
      selectedAssigneesIds: selectedAssignees,
      currDroppableId: selectedDroppableId,
    });
  },
  /**
   * Disable interations with assignees while the list is being refreshed. This also removes any checkboxes.
   *
   * @returns An enable function you can call once the assignees list is done refreshing.
   */
  disableMultiDragWhileRefreshing: () => {
    set({
      ...getDefaultMultiDragAssigneesStoreStateData(),
      currentlyRefreshing: true,
    });

    return () => {
      set({ currentlyRefreshing: false });
    };
  },
  reset: () => set({ ...getDefaultMultiDragAssigneesStoreStateData() }),
}));
