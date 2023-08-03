import { useEffect } from "react";
import { usePageInfoStore, useSubgroupListStore } from "../../gc-hooks";
import SubgroupCheckbox from "./components/SubgroupCheckbox";
import { connectToDb, getSubgroupList } from "../../gc-idb";

interface ISubgroupsDropdownProps {
  allAssigneeSpans: Map<string, HTMLSpanElement>;
}

export default function SubgroupsDropdown({
  allAssigneeSpans,
}: ISubgroupsDropdownProps) {
  const subgroupList = useSubgroupListStore((state) => state.subgroupList);

  return (
    <div>
      <h1 className="mt-2 ml-3 font-bold text-base">&#128101; Subgroups</h1>
      <details open>
        <summary className="ml-5 text-sm py-2">
          Subgroups ({`${subgroupList.length}`})
        </summary>
        {!!subgroupList.length ? (
          subgroupList.map((sgInDb) => (
            <SubgroupCheckbox
              key={sgInDb.subgroupName}
              info={sgInDb}
              assigneeSpans={sgInDb.assigneeIds.map(
                (id) => allAssigneeSpans.get(id) ?? id
              )}
            />
          ))
        ) : (
          <p className=".wrap-subgroup-list-placeholder-name ml-3 py-2">
            There are no subgroups. Use the "Subgroups" button to add some!
          </p>
        )}
      </details>
      <hr />
      <h1 className="mt-2 ml-3 font-bold text-base">&#128100; Assignees</h1>
    </div>
  );
}
