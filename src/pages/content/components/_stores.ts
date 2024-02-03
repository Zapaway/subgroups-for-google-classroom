import { GoogleClassroomAssigneeInfo } from "@src/gc-assignees";
import { create } from "zustand";

type Index = number;

type MultiDragAssigneesStoreStateData = {
    currDroppableId: string | null;  // ensures that we are dragging elements from the same droppable
    selectedAssigneesIds: Map<Index, string>;
    fromIndex: number;
    toIndex: number;
}
const getDefaultMultiDragAssigneesStoreStateData = () => ({
    currDroppableId: null,
    selectedAssigneesIds: new Map(),
    fromIndex: -1,
    toIndex: -1,
}) as MultiDragAssigneesStoreStateData;

type MultiDragAssigneesStoreStateFunc = {
    addAssignee: (index: Index, info: string, selectedDroppableId: string) => void;
    deleteAssignee: (index: Index, selectedDroppableId: string) => void;
    reset: () => void;
}

export const useMultiDragAssigneesStore = create<MultiDragAssigneesStoreStateData & MultiDragAssigneesStoreStateFunc>((set, get) => ({
    ...getDefaultMultiDragAssigneesStoreStateData(),
    addAssignee: (index, id, selectedDroppableId) => {
        const { selectedAssigneesIds: selectedAssignees, currDroppableId } = get();

        if (selectedDroppableId !== currDroppableId) {
            selectedAssignees.clear();
        }

        selectedAssignees.set(index, id);

        set({ selectedAssigneesIds: selectedAssignees, currDroppableId: selectedDroppableId });
    },
    deleteAssignee: (index, selectedDroppableId) => {
        const { selectedAssigneesIds: selectedAssignees, currDroppableId} = get();

        if (selectedDroppableId !== currDroppableId) {
            selectedAssignees.clear();
        }
        else {
            selectedAssignees.delete(index);
        }

        set({ selectedAssigneesIds: selectedAssignees, currDroppableId: selectedDroppableId });
    },
    reset: () => set({...getDefaultMultiDragAssigneesStoreStateData()}),
}));