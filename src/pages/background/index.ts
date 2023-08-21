import slug from "slug";

export type RequestOptions =
  | {
      type: "export";
      url: string;
      classroomName: string;
    }
  | {
      type: "import";
    };

chrome.runtime.onMessage.addListener(function (
  request: RequestOptions,
  _,
  sendResponse
) {
  if (request.type === "export") {
    chrome.downloads.download({ url: request.url, filename: `${[slug(request.classroomName), "subgroups.csv"].join("-")}` }, (downloadId) => {
        sendResponse(downloadId);
    });
  } else if (request.type === "import") {
  }
});
