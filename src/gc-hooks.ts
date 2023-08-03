import { create } from "zustand";
import { GoogleClassroomState, IPageInfo, getPageInfo } from "./gc-page-info";
import { GoogleClassroomAssigneeInfo } from "./gc-assignees";
import { GoogleClassroomSubgroupInfo } from "./gc-idb";

interface IPageInfoStoreState extends IPageInfo {
  checkPageType: (url: string) => void;
}

export const usePageInfoStore = create<IPageInfoStoreState>((set) => ({
  pageType: GoogleClassroomState.HOME,
  classroomID: "",
  isTeacher: false,
  checkPageType: (url) => set({ ...getPageInfo(url) }),
}));

interface IGoogleClassroomNameStoreState {
  classroomName: string;
  changeClassroomName: (newClassroomName: string) => void;
}

export const useGoogleClassroomNameStore =
  create<IGoogleClassroomNameStoreState>((set) => ({
    classroomName: "Google Classroom",
    changeClassroomName: (newClassroomName) => {
      set({ classroomName: newClassroomName });
    },
  }));

interface IAssigneeListStoreState {
  assigneeList: GoogleClassroomAssigneeInfo[];
  invalidateAssigneeList: (
    newAssigneeList: GoogleClassroomAssigneeInfo[]
  ) => void;
}

export const useAssigneeListStore = create<IAssigneeListStoreState>((set) => ({
  assigneeList: [],
  invalidateAssigneeList: (newAssigneeList) =>
    set({ assigneeList: newAssigneeList }),
}));

interface ISubgroupListStoreState {
  subgroupList: GoogleClassroomSubgroupInfo[];
}

/**
 * Global store to store all subgroups that are in DB.
 *
 * NOTE: This is automatically updated by `loadSubgroups()` of `useTempSubgroupsStore()`
 * in `pages/content/components/temp-subgroup/stores.ts` as the modal button
 * is always in the HTMl and automatically updates subgroups if classroomID or DB changes.
 */
export const useSubgroupListStore = create<ISubgroupListStoreState>((set) => ({
  subgroupList: [],
}));

interface IUserTypeStoreState {
  isTeacher: boolean;
  setIsTeacher: (isTeacher: boolean) => void;
}

export const useUserTypeStore = create<IUserTypeStoreState>((set) => ({
  isTeacher: false,
  setIsTeacher: (isTeacher) => set({ isTeacher }),
}));
