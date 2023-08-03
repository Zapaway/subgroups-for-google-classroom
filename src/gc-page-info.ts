/**
 * Describe the Google Classroom page the user is on.
 */
export enum GoogleClassroomState {
  HOME, // all of the Google Classrooms the user is in is shown
  STREAM, // the "stream" tab is currently selected
  CLASSWORK, // the "classwork" tab is currently selected
  ASSIGNMENT, // the user is currently viewing an assignment
  QUESTION, // the user is currently viewing a question
  MATERIAL, // the user is currently viewing material
  PEOPLE, // the "people" tab is currently selected
  GRADES, // the "grades" tab is currently selected (only teachers)
}

// All regular expressions for determining the GC state.
const HOME_RE = /:\/\/classroom\.google\.com.*\/h/;
const STREAM_RE = /:\/\/classroom\.google\.com.*\/c\/([a-zA-Z0-9]+)/;
const ASSIGNMENT_RE = /:\/\/classroom\.google\.com.*\/c\/([a-zA-Z0-9]+)\/a/;
const QUESTION_RE = /:\/\/classroom\.google\.com.*\/c\/([a-zA-Z0-9]+)\/mc/;
const MATERIAL_RE = /:\/\/classroom\.google\.com.*\/c\/([a-zA-Z0-9]+)\/m/;
const GRADE_RE = /:\/\/classroom\.google\.com.*\/c\/([a-zA-Z0-9]+)\/gb/;
const CLASSWORK_RE = /:\/\/classroom\.google\.com.*\/w\/([a-zA-Z0-9]+)/;
const PEOPLE_RE = /:\/\/classroom\.google\.com.*\/r\/([a-zA-Z0-9]+)/;

const GC_STATE_REGEX_MAP = new Map<number, RegExp>([
  [GoogleClassroomState.HOME, HOME_RE],
  [GoogleClassroomState.STREAM, STREAM_RE],
  [GoogleClassroomState.ASSIGNMENT, ASSIGNMENT_RE],
  [GoogleClassroomState.QUESTION, QUESTION_RE],
  [GoogleClassroomState.MATERIAL, MATERIAL_RE],
  [GoogleClassroomState.GRADES, GRADE_RE],
  [GoogleClassroomState.CLASSWORK, CLASSWORK_RE],
  [GoogleClassroomState.PEOPLE, PEOPLE_RE],
]);

/**
 * Determine the type of Google Classroom page based on URL.
 * @param url The URL of the Google Classroom tab.
 * @returns The current GC state and applicable Google Classroom ID.
 */
export function getPageInfo(url: string): IPageInfo {
  let pageType: GoogleClassroomState;

  if (HOME_RE.test(url)) {
    pageType = GoogleClassroomState.HOME;
  } else if (GRADE_RE.test(url)) {
    pageType = GoogleClassroomState.GRADES;
  } else if (ASSIGNMENT_RE.test(url)) {
    pageType = GoogleClassroomState.ASSIGNMENT;
  } else if (QUESTION_RE.test(url)) {
    pageType = GoogleClassroomState.QUESTION;
  } else if (MATERIAL_RE.test(url)) {
    pageType = GoogleClassroomState.MATERIAL;
  } else if (STREAM_RE.test(url)) {
    pageType = GoogleClassroomState.STREAM;
  } else if (CLASSWORK_RE.test(url)) {
    pageType = GoogleClassroomState.CLASSWORK;
  } else if (PEOPLE_RE.test(url)) {
    pageType = GoogleClassroomState.PEOPLE;
  } else {
    // just default to home
    pageType = GoogleClassroomState.HOME;
  }

  // get the classroom ID if user is on individual Google Classrom page
  let classroomID = "";
  if (pageType !== GoogleClassroomState.HOME) {
    classroomID = url.match(GC_STATE_REGEX_MAP.get(pageType)!)![1];
  }

  return { pageType, classroomID };
}

export interface IPageInfo {
  pageType: GoogleClassroomState;
  classroomID: string; // NOTE: if pageType is HOME, then this will be empty string
}

/**
 * Get the classroom name if applicable.
 * @returns "Google Classroom" if on the home page or the classroom name if on an individual classroom page.
 */
export function getClassroomName() {
  const container = document.querySelector("#UGb2Qe");
  if (!container) return "Google Classroom";

  return container.textContent!;  // guaranteed
}

/**
 * Verify that the user is a teacher by checking if the "Grades" tab exists.
 * @returns `true` if user is a teacher, otherwise `false`.
 */
export function isUserATeacher() {
  const gradeAnchor = document.querySelector("#kO001e > div.QRiHXd > div.R2tE8e.QRiHXd.VHRSDf > div > div:nth-child(4) > a");
  return !!gradeAnchor;
}
