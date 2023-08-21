import { type GoogleClassroomAssigneeInfo } from "../../../../gc-assignees";

interface IImportedSubgroupInfoProps {
  subgroupName: string;
  assigneeFoundInfo: GoogleClassroomAssigneeInfo[];
  assigneeNotFoundInfo: string[];
}

export default function ImportedSubgroupInfo({
  subgroupName,
  assigneeFoundInfo,
  assigneeNotFoundInfo,
}: IImportedSubgroupInfoProps) {
  return (
    <div className="w-full">
      <h1 className="text-lg font-bold">{subgroupName}</h1>
      <div className="grid grid-flow-col auto-cols-fr">
        {!!assigneeFoundInfo.length && (
          <ul className="bg-green-100 border border-green-300 p-3 rounded-md text-base flex flex-col gap-1 overflow-x-auto">
            <li className="italic">
              <b>{assigneeFoundInfo.length}</b> students were found.
            </li>
            {assigneeFoundInfo.map((a) => (
              <li key={a.id}>
                <div className="flex flex-row align-middle gap-2">
                  <img
                    src={a.pfpUrl}
                    alt={`Profile picture of ${a.firstName} ${a.lastName} ${a.email ?? a.id}`}
                    className="avatar w-5 h-5 rounded-full"
                  />
                  <p>
                    {a.firstName} {a.lastName} ({a.email ?? a.id})
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!!assigneeNotFoundInfo.length && (
          <div className="bg-red-100 border border-red-300 p-3 rounded-md text-base flex flex-col gap-1 overflow-x-auto">
            <p className="italic">
              <b>{assigneeNotFoundInfo.length}</b> students could not be found
              in the database.
              <details className="text-sm max-w-[75ch]">
                <summary className="hover:cursor-pointer">More details</summary>
                <p>
                  Try refreshing the assignee list or double-checking the
                  emails/IDs to make sure they are correct.{" "}
                  <u>
                    You may continue to import the subgroups, but these
                    assignees won't be included.
                  </u>
                </p>
              </details>
            </p>
            <ul className="list-disc ml-5">
              {assigneeNotFoundInfo.map((identity, i) => (
                <li key={i}>{identity}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
