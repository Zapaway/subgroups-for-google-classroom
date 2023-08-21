import slug from "slug";

export type RequestOptions =
  | {
      type: "export";
      url: string;
      classroomName: string;
    }
  | {
      type: "open";
      url: string;
    };

chrome.runtime.onMessage.addListener(function (
  request: RequestOptions,
  _,
  sendResponse
) {
  if (request.type === "export") {
    chrome.downloads.download(
      {
        url: request.url,
        filename: `${[slug(request.classroomName), "subgroups.csv"].join("-")}`,
      },
      (downloadId) => {
        sendResponse(downloadId);
      }
    );
  } else if (request.type === "open") {
    chrome.tabs.create({ url: request.url });
  }
});
