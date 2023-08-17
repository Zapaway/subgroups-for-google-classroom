import { getPageInfo } from "./gc-page-info";

export type GoogleClassroomAssigneeInfo = {
  id: string;
  pfpUrl: string;
  firstName: string;
  lastName: string;
  email: string;
};

// for dropdown animation detection
const DROPDOWN_ANIMATION_CLASSES = ["JPdR6b", "hVNH5c", "qjTEB"] as const;

// for clicking
const CLICK_TIMEOUT_MS = 3 as const;
function simulateClickOn(element: HTMLElement) {
  element.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  );
  element.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window })
  );
}

/**
 * Get all assignnees from the dropdown. This works for all types of classroom
 * material, from stream announcements to question assignments.
 * @returns All <span> elements for assignees. If it cannot be found, return `null`.
 */
export function getAllAssigneesFromDropdown() {
  const divAssigneesContainer = document.querySelector(
    "div.JPdR6b.e5Emjc.hVNH5c.qjTEB > div > div"
  );
  if (!divAssigneesContainer) return null;

  // modify preventDefault and other function params so that
  // future events can functionally dispatch
  const spans = Array.from(divAssigneesContainer.children) as HTMLSpanElement[];
  for (const span of spans) {
    const modifiedJsActions = span
      .getAttribute("jsaction")!
      .replaceAll("(preventDefault=true)", "")
      .replaceAll("(preventMouseEvents=true)", "");

    span.setAttribute("jsaction", modifiedJsActions);
  }

  return spans;
}

/**
 * Get all students from the "people" tab.
 * @returns Information about each assignee.
 */
export async function getAllAssigneesFromPeopleTab() {
  // !cannot use hooks as it will generate React code in external script
  // TODO GET BUTTON ELEMENT FROM HERE
  const pageInfo = getPageInfo(window.location.href);

  // get the table body containing assignees' info
  // NOTE:  Recently visited Google Classroom pages is stored in cache,
  //        so make sure that we pick the right renderer
  const assigneesContainer = document.querySelector(
    `c-wiz[jsrenderer="R7jH8d"][data-p*="${pageInfo.classroomID}"] > div > div > main > div.pEwOBc.HTxhwc > table > tbody`
  );
  if (!assigneesContainer)
    throw new Error("Make sure the user is on the 'People' tab!");

  // --- now get the rows that can be iterated over
  const assigneeRows = Array.from(
    assigneesContainer.children
  ) as HTMLTableRowElement[];
  const assignees: GoogleClassroomAssigneeInfo[] = [];

  for (const row of assigneeRows) {
    const id = row.getAttribute("data-current-student-id")!;

    // get shared span between pfp and full name containers
    const visibleInfoContainer = row.querySelector(
      "td.iFGZdc.gQZxn.njieAf.asQXV > div.QRiHXd > span.YHVwkf"
    )!;

    const pfpImage = visibleInfoContainer.querySelector(
      "span.g2DEGd.PNAi9e > img"
    )! as HTMLImageElement;
    const pfpUrl = pfpImage.src;

    const fullNameContainer = visibleInfoContainer.querySelector(
      "span.WbqQDb > span.g2DEGd.KwqU3e.QRiHXd > span.y4ihN.YVvGBb"
    )!;
    const fullNameParts = fullNameContainer.textContent!.split(" ");
    const firstName = fullNameParts.slice(0, -1).join(" ");
    const lastName = fullNameParts.at(-1)!;

    // --- now simulate a click on the options and get the email
    const optionsButton = row.querySelector(
      "td.Mlpuof.gQZxn.PeKgHf.pOf0gc > div > div"
    )! as HTMLDivElement;
    let email = "";

    // set up an observer so that we can click on the options button and get the email
    const docObsConfig = { childList: true, subtree: true };
    const docObserver = new MutationObserver((muts, observer) => {
      const optionsDropdown = document.querySelector(
        `#yDmH0d > div.JPdR6b.hVNH5c.qjTEB > div > div > span:nth-child(1)`
      );
      if (!optionsDropdown) return;

      email = optionsDropdown.getAttribute("aria-label")!.split(" ")[1];
    });
    docObserver.observe(document.body, docObsConfig);

    // now click
    simulateClickOn(optionsButton);
    await new Promise((r) => setInterval(r, 1000));

    // wait until we get the email
    await new Promise<void>((res) => {
      (function waitUntilEmailRecieved() {
        if (email !== "") {
          docObserver.disconnect();
          simulateClickOn(optionsButton);
          return res();
        }
        setTimeout(waitUntilEmailRecieved, CLICK_TIMEOUT_MS);
      })();
    });

    assignees.push({ id, pfpUrl, firstName, lastName, email });
  }

  // /// for testing purposes
  // const scriptUrl =
  //   "https://script.google.com/macros/s/AKfycbzZpqPR3xW9EsmsIaQFAiHPncbqO7GJ8YWVRFufclCcwpDwsCb7k-TqxCfrdYBBxVNY/exec";
  // const assigneesJsonData = assignees.map(({email, id}) => ({email, id}));

  // fetch(scriptUrl, {
  //   method: "POST",
  //   mode: "no-cors",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify(assigneesJsonData),
  // })
  //   .then((response) => response.text())
  //   .then((result) => {
  //     console.log(result);
  //   })
  //   .catch((error) => {
  //     console.error("Error:", error);
  //   });

  return assignees;
}
