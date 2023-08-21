import { createRoot } from "react-dom/client";

import SubgroupsButton from "./SubgroupsButton";
import SubgroupsModal from "./SubgroupsModal";
import "./index.css";

import { usePageInfoStore, useUserTypeStore } from "../../gc-hooks";
import { GoogleClassroomState, isUserATeacher } from "../../gc-page-info";
import SubgroupsDropdown from "./SubgroupsDropdown";
import DonateButton from "./DonateButton";
import ImportTempSubgroupsModal from "./components/temp-subgroup/ImportTempSubgroupsModal";

/// --- SUBGROUPS BUTTON --- ///
// prepend React div to the right side of the navbar
const navbarRight = document.querySelector(
  "#kO001e > div.QRiHXd > div.Mtd4hb.QRiHXd"
);
if (!navbarRight) throw new Error("Cannnot find the React root element.");
const nrDiv = document.createElement("div");
nrDiv.id = "__react-navbar-right";
navbarRight.prepend(nrDiv);

// render the Subgroups & Donate button on the navbar
const nrRoot = createRoot(nrDiv);
nrRoot.render(
  <div className="flex flex-row">
    <DonateButton />
    <SubgroupsButton />
  </div>
);

/// --- MODALS --- ///
// add React div to the root
const rootDiv = document.createElement("div");
rootDiv.id = "__react-root";
document.body.append(rootDiv);

// render the modals on the root
const root = createRoot(rootDiv);
root.render(
  <div>
    <SubgroupsModal />
    <ImportTempSubgroupsModal />
  </div>
);

/// --- UPDATING PAGE TYPE CONSTANTLY --- ///
let prevHref = "";
let prevPageType = GoogleClassroomState.HOME;
let prevClassroomId = "";

// detect if a fullscreen modal is open
let modal: HTMLElement | null = null; // this opens when something (assignment, etc.) is edited or created
let startListeningToModal: boolean = false;
let modalDetector: HTMLElement | null = null;
const modalDetectorConfig = { attributes: true };
const modalDetectorObserver = new MutationObserver((muts, observer) => {
  for (const mut of muts) {
    const detectorElement = mut.target as HTMLElement;

    if (mut.attributeName === "aria-hidden") {
      const value = detectorElement.getAttribute("aria-hidden");
      startListeningToModal = value !== null;

      if (value === null) {
        // the modal has closed, so disconnect everything
        modal = null;
        assigneeDropdownCheckbox = null;

        // this covers a case in which the teacher is on the "Stream"
        // tab and while the announcement is being created,
        // the teacher decides to edit another announcement/material that
        // opens up a modal
        if (!isAnnouncementBeingCreated) {
          assigneeDropdownCheckboxObserver.disconnect();
        }
      }
    }
  }
});

// detect if the user is creating an announcement in the "Stream" tab
// NOTE: editing an announcement is handled by modal
let createAnnouncementDiv: HTMLDivElement | null = null;
let isAnnouncementBeingCreated = false;
const createAnnouncementDivConfig = { childList: true };
const createAnnouncementDivObserver = new MutationObserver((muts, observer) => {
  // "muts" has the same result three times in a row, so let's just do one
  const mut = muts[0];

  const div = mut.target as HTMLDivElement;
  if (div.childElementCount === 1) {
    isAnnouncementBeingCreated = false;
    assigneeDropdownCheckboxObserver.disconnect();
  } else {
    // if there are more than one child, then its open
    isAnnouncementBeingCreated = true;
    assigneeDropdownCheckboxObserver.observe(
      document.body,
      assigneeDropdownCheckboxConfig
    );
  }
});

// detect if the assignee dropdown checkbox list is open (can be in a modal or on stream)
let assigneeDropdownCheckbox: HTMLDivElement | null = null;
const assigneeDropdownCheckboxConfig = { childList: true, subtree: true };
const assigneeDropdownCheckboxObserver = new MutationObserver(
  (muts, observer) => {
    const staleState = assigneeDropdownCheckbox;
    const hydratedState = document.querySelector(
      "#yDmH0d > div.JPdR6b.e5Emjc.hVNH5c.qjTEB > div > div"
    ) as HTMLDivElement;

    if (staleState === null) {
      if (hydratedState !== null) {
        // DROPDOWN IS NOW OPEN
        // check if dropdown is listing courses or assignees
        const options = Array.from(hydratedState.children).filter(
          (child) => child.tagName === "SPAN"
        ) as HTMLSpanElement[];
        const firstOption = options[0]; // this span is either "All Students" or the first course
        const allStudentsDiv = firstOption.querySelector(
          `div.uyYuVb.oJeWuf[data-student-id="all-students"]`
        );

        if (allStudentsDiv) {
          // give a map of student id to student span element
          const assigneeSpans = options.length > 1 ? options.slice(1) : [];
          const assigneeSpansMap: Map<string, HTMLSpanElement> = new Map();
          for (const span of assigneeSpans) {
            const assigneeIdDiv = span.querySelector("div.uyYuVb.oJeWuf");
            const assigneeId = assigneeIdDiv?.getAttribute("data-student-id")!;
            assigneeSpansMap.set(assigneeId, span);
          }

          // inject div for React rendering
          const subgroupDropdownDiv = document.createElement("div");
          subgroupDropdownDiv.id = "__react-subgroups-in-assignee-dropdown";
          hydratedState.prepend(subgroupDropdownDiv);

          console.log("map", assigneeSpansMap);

          // render the subgroup checkboxes in the assignee dropdown
          const subgroupDropdownRoot = createRoot(subgroupDropdownDiv);
          subgroupDropdownRoot.render(
            <SubgroupsDropdown allAssigneeSpans={assigneeSpansMap} />
          );
        }
      }
    }

    assigneeDropdownCheckbox = hydratedState;
  }
);

// main observer to track changes
const docObsConfig = { childList: true, subtree: true };
const docObserver = new MutationObserver((muts, observer) => {
  const { getState } = usePageInfoStore;

  // track URL changes
  for (const _ of muts) {
    const currHref = window.location.href;
    if (prevHref !== currHref) {
      prevHref = currHref;
      getState().checkPageType(prevHref); // update page state
    }
  }

  // connect the modal detector ONCE
  if (modalDetector === null) {
    modalDetector = document.querySelector(
      `#yDmH0d > div[jscontroller="k4ha3"]`
    );

    if (modalDetector !== null) {
      modalDetectorObserver.disconnect(); // prevent duplicate observers
      modalDetectorObserver.observe(modalDetector, modalDetectorConfig);
    }
  }

  // if we are in a modal, get the modal ONCE and start observing for assignee dropdown
  if (startListeningToModal) {
    if (modal === null) {
      modal = document.querySelector("#yDmH0d > div.NBxL9e.iWO5td");

      if (modal) {
        // modal has loaded, so start observing
        assigneeDropdownCheckbox = null;
        assigneeDropdownCheckboxObserver.disconnect();
        assigneeDropdownCheckboxObserver.observe(
          document.body,
          assigneeDropdownCheckboxConfig
        );
      }
    }
  }

  const currPageType = getState().pageType;
  const currClassroomId = getState().classroomId;

  // see if the user is a teacher
  if (currPageType === GoogleClassroomState.HOME) {
    // give teacher perm for now to display "Go to a Google Classroom to get started"
    useUserTypeStore.setState({ isTeacher: true });
  } else {
    useUserTypeStore.setState({ isTeacher: isUserATeacher() });
  }

  // if we are in the "Stream" tab, trigger when the user creates an announcement
  if (currPageType === GoogleClassroomState.STREAM) {
    // if coming from a non-stream tab in the same classroom or
    // any tab on a different classroom entirely
    if (
      prevPageType !== GoogleClassroomState.STREAM ||
      prevClassroomId !== currClassroomId
    ) {
      createAnnouncementDiv = document.querySelector(
        `c-wiz[jsrenderer="BZn5fd"][data-p*="${currClassroomId}"] > div > div > div.dbEQNc > div.M7zXZd > main > section > div > div.zOtZye.LBlAUc.GWZ7yf.nmFHZb`
      );

      // we need to make sure if the create announcement div is opened already
      // since we need to reconnect it and listen to the dropdown right away
      if (
        createAnnouncementDiv &&
        createAnnouncementDiv.childElementCount > 1
      ) {
        isAnnouncementBeingCreated = true;
        createAnnouncementDivObserver.disconnect();
        createAnnouncementDivObserver.observe(
          createAnnouncementDiv,
          createAnnouncementDivConfig
        );
        assigneeDropdownCheckboxObserver.observe(
          document.body,
          assigneeDropdownCheckboxConfig
        );
      }
      // if this isn't the case, even if the div exists, we instead want to opt to
      // listening when the create announcement div is opened
      else {
        isAnnouncementBeingCreated = false;
        createAnnouncementDiv = null;
        createAnnouncementDivObserver.disconnect();
        assigneeDropdownCheckboxObserver.disconnect();
      }
    }

    // set the create announcement div and observer ONCE
    if (createAnnouncementDiv === null) {
      createAnnouncementDiv = document.querySelector(
        `c-wiz[jsrenderer="BZn5fd"][data-p*="${currClassroomId}"] > div > div > div.dbEQNc > div.M7zXZd > main > section > div > div.zOtZye.LBlAUc.GWZ7yf.nmFHZb`
      );
      if (createAnnouncementDiv !== null) {
        createAnnouncementDivObserver.disconnect();
        createAnnouncementDivObserver.observe(
          createAnnouncementDiv,
          createAnnouncementDivConfig
        );
      }
    }
  }
  // if not on "Stream" tab then stop listening to create announcement div
  else {
    // having this will make sure unncessary duplicate calls wont run
    if (createAnnouncementDiv) {
      isAnnouncementBeingCreated = false;
      createAnnouncementDiv = null;
      createAnnouncementDivObserver.disconnect();
      assigneeDropdownCheckboxObserver.disconnect();
    }
  }

  prevPageType = currPageType;
  prevClassroomId = currClassroomId;
});
docObserver.observe(document.body, docObsConfig);
