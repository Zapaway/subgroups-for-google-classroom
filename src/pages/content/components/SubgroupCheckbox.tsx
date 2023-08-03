import { GoogleClassroomAssigneeInfo } from "../../../gc-assignees";
import { usePageInfoStore } from "../../../gc-hooks";
import {
  connectToDb,
  getAssignee,
  type GoogleClassroomSubgroupInfo,
} from "../../../gc-idb";
import { useEffect, useState, useRef } from "react";

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

interface ISubgroupCheckboxProps {
  info: GoogleClassroomSubgroupInfo;

  /**
   * Span represents that the option exists. String represents that it doesn't.
   */
  assigneeSpans: (HTMLSpanElement | string)[];
}

export default function SubgroupCheckbox({
  info,
  assigneeSpans,
}: ISubgroupCheckboxProps) {
  const [assignees, setAssignees] = useState<GoogleClassroomAssigneeInfo[]>([]);
  const [notFoundAssignees, setNotFoundAssignees] = useState<
    GoogleClassroomAssigneeInfo[]
  >([]);
  const [goObserve, setGoObserve] = useState(true); // start observing on load
  const checkboxRef = useRef<HTMLInputElement | null>(null);

  const { subgroupName, assigneeIds } = info;
  const actualAssigneeSpans = assigneeSpans.filter(
    (s): s is HTMLSpanElement => s instanceof HTMLSpanElement
  );

  const getCheckedAssigneeSpans = () => {
    return actualAssigneeSpans.filter(
      (s) => s.getAttribute("aria-checked") === "true"
    );
  };
  const getUncheckedAssigneeSpans = () => {
    return actualAssigneeSpans.filter(
      (s) => s.getAttribute("aria-checked") === "false"
    );
  };

  // turn assignee ids into assignees
  useEffect(() => {
    (async () => {
      const classroomId = usePageInfoStore.getState().classroomID;
      const db = await connectToDb(classroomId);

      const existingAssigneeIds: string[] = []; // assignees that show up on dropdown
      const notFoundAssigneeIds: string[] = []; // assignees that don't show up
      for (const id of assigneeIds) {
        if (assigneeSpans.includes(id)) notFoundAssigneeIds.push(id);
        else existingAssigneeIds.push(id);
      }

      const existingAssignees = (
        await Promise.all(existingAssigneeIds.map((id) => getAssignee(db, id)))
      ).filter((r): r is GoogleClassroomAssigneeInfo => !!r); // filter out any undefined
      setAssignees(existingAssignees);

      // by default, the subgroup is unchecked
      // however, if "All students" is checked or all of the assignees are checked,
      // then we need to check the subgroup
      // NOTE: the observer only takes effect when something is CLICKED, hence we need to check here
      if (getCheckedAssigneeSpans().length === existingAssignees.length) {
        await new Promise<void>((res) => {
          (function waitUntilCheckboxRefIsSet() {
            if (checkboxRef.current) {
              checkboxRef.current.checked = true;
              return res();
            }
            setTimeout(waitUntilCheckboxRefIsSet, CLICK_TIMEOUT_MS);
          })();
        });
      }

      // load in names of assignees that could not be found in the assignee list dropdown
      // NOTE: if this is the case, then a student must've left the GC and the teacher
      //       has yet to refresh the list (meaning that the student should still exist in db
      //       until refresh)
      const notFoundAssignees = (
        await Promise.all(notFoundAssigneeIds.map((id) => getAssignee(db, id)))
      ).filter((r): r is GoogleClassroomAssigneeInfo => !!r); // filter out any undefined
      setNotFoundAssignees(notFoundAssignees);
    })();
  }, []);

  // listen to any attribute changes
  useEffect(() => {
    if (!goObserve) return;

    const spanObsConfig = { attributes: true };
    const spanObserver = new MutationObserver((muts, observer) => {
      for (const mut of muts) {
        if (mut.attributeName === "aria-checked") {
          const currAssigneeSpan = mut.target as HTMLSpanElement;
          const isSpanChecked = currAssigneeSpan.getAttribute("aria-checked");

          // even if there's one unchecked assignee, this subgroup is unchecked since
          // there's one assignee missing
          if (isSpanChecked === "false") {
            checkboxRef.current!.checked = false;
            return;
          }

          // if the user has manually checked off each assignee in the subgroup
          const checkedAssignees = getCheckedAssigneeSpans();
          if (checkedAssignees.length === assignees.length) {
            checkboxRef.current!.checked = true;
          }
        }
      }
    });

    for (const span of actualAssigneeSpans) {
      spanObserver.observe(span, spanObsConfig);
    }

    return () => spanObserver.disconnect();
  }, [goObserve, assignees]);

  return (
    <div className="hover:bg-black hover:bg-opacity-5 px-4 py-2">
      <label className="label cursor-pointer justify-start p-0">
        <input
          type="checkbox"
          disabled={!assignees.length}
          className="checkbox checkbox-sm"
          onClick={async () => {
            setGoObserve(false);

            // if checked, check any unchecked assignees
            // if unchecked, uncheck any checked assignees
            const isChecked = checkboxRef.current!.checked;
            const spansToClick = isChecked
              ? getUncheckedAssigneeSpans()
              : getCheckedAssigneeSpans();

            for (const span of spansToClick) {
              simulateClickOn(span);

              // don't spam request instantly
              await new Promise((r) => setTimeout(r, 10));
            }

            setGoObserve(true);
          }}
          ref={checkboxRef}
        />
        <span className="wrap-subgroup-name label-text ml-4">
          <span className="font-bold">{subgroupName}</span>
          <br />
          {!!assignees.length ? (
            <div className="grid grid-cols-1 gap-1">
              {assignees.map(({ id, firstName, lastName, pfpUrl }) => (
                <div className="flex flex-row gap-1" key={id}>
                  <img
                    src={pfpUrl}
                    width={20}
                    height={20}
                    className="self-start rounded-full"
                  />
                  <p className="pl-1">
                    {firstName} {lastName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>
              <i>{"(This subgroup is empty!)"}</i>
            </p>
          )}
          {!!notFoundAssignees.length && (
            <div className="bg-red-200 rounded-md mt-1 flex flex-col p-1">
              <span className="text-xs pl-1 mb-2">
                <p className="font-bold">Assignee(s) not found!</p>
                <details>
                  <summary>More details</summary>
                  <p className="italic">
                    The following assignee(s) have left the Google Classroom and
                    therefore cannot be selected in this dropdown. If you want
                    to make this message disappear, either remove these
                    assignee(s) from the subgroup or refresh the list.
                  </p>
                </details>
              </span>
              {notFoundAssignees.map(({ id, firstName, lastName, pfpUrl }) => (
                <div className="flex flex-row gap-1" key={id}>
                  <img
                    src={pfpUrl}
                    width={20}
                    height={20}
                    className="self-start rounded-full"
                  />
                  <p className="pl-1">
                    {firstName} {lastName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </span>
      </label>
    </div>
  );
}
