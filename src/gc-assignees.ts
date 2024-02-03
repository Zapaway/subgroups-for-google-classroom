import { getPageInfo } from "./gc-page-info";

export type GoogleClassroomAssigneeInfo = {
  id: string;
  pfpUrl: string;
  firstName: string;
  lastName: string;

  // this is undefined initally since it needs to be webscraped or database
  // also handles outdated versions of idb
  email?: string;
};

// for clicking
export const DROPDOWN_ANIMATION_DURATION_MS = 10001 as const;
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
 * Helper function to get the HTML for each assignee.
 * @returns HTML rows with assignee information.
 */
function getAssigneeHTMLRows() {
  const pageInfo = getPageInfo(window.location.href);

  // get the table body containing assignees' info
  // NOTE:  Recently visited Google Classroom pages is stored in cache,
  //        so make sure that we pick the right renderer
  const assigneesContainer = document.querySelector(
    `c-wiz[jsrenderer="R7jH8d"][data-p*="${pageInfo.classroomId}"] > div > div > main > div.pEwOBc.HTxhwc > table > tbody`
  );
  if (!assigneesContainer)
    throw new Error("Make sure the user is on the 'People' tab!");

  // --- now get the rows that can be iterated over
  const assigneeRows = Array.from(
    assigneesContainer.children
  ) as HTMLTableRowElement[];

  return assigneeRows;
}

/**
 * Get all students from the "people" tab EXCEPT email.
 * @returns Information about each assignee.
 */
export function getAllAssigneesWithoutEmailFromPeopleTab() {
  // !cannot use hooks as it will generate React code in external script
  const assigneeRows = getAssigneeHTMLRows();
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

    assignees.push({ id, pfpUrl, firstName, lastName });
  }

  return assignees;
}

const FIND_DROPDOWN_TIMEOUT_MS = 10000;
export const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const DROPDOWN_ERROR = (code: number) =>
  `Couldn't find email due to updated Google Classroom UI.\nPlease report this bug. Code: DD${code}`;
const OPTIONS_BUTTON_DOESNT_EXIST = DROPDOWN_ERROR(1);
const OPTIONS_DROPDOWN_DOESNT_EXIST = DROPDOWN_ERROR(2);
const OPTIONS_DROPDOWN_EMAIL_DOESNT_EXIST = DROPDOWN_ERROR(3);

export async function updateAssigneesWithEmailFromPeoplesTab(
  assigneesToUpdateMap: Map<string, GoogleClassroomAssigneeInfo>
) {
  const assigneeRows = getAssigneeHTMLRows();
  const res: GoogleClassroomAssigneeInfo[] = [];

  // if error, then dropdown doesn't exist and will only last FIND_DROPDOWN_TIMEOUT_MS,
  // regardless of number of assignees
  let dropdownStatus: "success" | "error" = "success";

  for (const row of assigneeRows) {
    const id = row.getAttribute("data-current-student-id")!;
    const assignee = assigneesToUpdateMap.get(id);
    if (!assignee) continue; // skip over assignees we dont need to get email for

    // now simulate a click on the options and get the email
    const optionsButton = row.querySelector(
      "td.Mlpuof.gQZxn.PeKgHf.pOf0gc > div > div"
    ) as HTMLDivElement | null;
    let email = "";
    if (!optionsButton) {
      email = OPTIONS_BUTTON_DOESNT_EXIST;
      continue;
    }

    // set up an observer so that we can click on the options button and get the email
    const docObsConfig = { childList: true, subtree: true };
    const docObserver = new MutationObserver((muts, observer) => {
      const optionsDropdown = document.querySelector(
        `#yDmH0d > div.JPdR6b.hVNH5c.qjTEB > div > div > span:nth-child(1)`
      );
      if (!optionsDropdown) return;

      const possibleEmail = optionsDropdown
        .getAttribute("aria-label")!
        .split(" ")[1];
      if (EMAIL_REGEX.test(possibleEmail)) {
        email = possibleEmail;
      } else {
        email = OPTIONS_DROPDOWN_EMAIL_DOESNT_EXIST;
      }
    });

    if (dropdownStatus === "success") {
      // if cannot find the email in 10 seconds, then google has changed dropdown html code
      dropdownStatus = await new Promise<"success" | "error">(
        async (response) => {
          const timer = setTimeout(() => {
            return response("error");
          }, FIND_DROPDOWN_TIMEOUT_MS);

          docObserver.observe(document.body, docObsConfig);

          // now click
          simulateClickOn(optionsButton);
          await new Promise((r) => setInterval(r, DROPDOWN_ANIMATION_DURATION_MS));

          // wait until we get the email
          await new Promise<void>((emailRes) => {
            (function waitUntilEmailRecieved() {
              if (email !== "") {
                docObserver.disconnect();
                simulateClickOn(optionsButton);
                return emailRes();
              }
              setTimeout(waitUntilEmailRecieved, DROPDOWN_ANIMATION_DURATION_MS);
            })();
          });
          
          clearTimeout(timer);
          res.push({ ...assignee, email });
          return response("success");
        }
      );
    }

    if (dropdownStatus === "error") {
      res.push({
        ...assignee,
        email: OPTIONS_DROPDOWN_DOESNT_EXIST,
      });
    }
  }

  return res;
}
