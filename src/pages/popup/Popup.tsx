import logo from "@assets/img/logo.svg";
import { RequestOptions } from "../background";

export default function Popup(): JSX.Element {
  const manifestData = chrome.runtime.getManifest();

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 text-center h-full w-full px-1 py-3">
      <div className="flex flex-col items-center justify-center">
        <img src={logo} className="h-16 w-16" />
        <h1 className="text-xl font-bold">{manifestData.name}</h1>
        <p className="text-lg">v{manifestData.version}</p>
        <p className="text-lg">by {manifestData.author}</p>
        <p className="text-base max-w-[30ch]">{manifestData.description}</p>
        <div>
          <div className="tooltip" data-tip="Leave a review!">
            <button
              className="btn btn-circle btn-ghost hover:fill-[#009933]"
              onClick={async () => {
                await chrome.runtime.sendMessage<RequestOptions>({
                  type: "open",
                  url: "https://chrome.google.com/webstore/detail/subgroups-for-google-clas/liihdnckdcohbeincekdciebinhmpfab/reviews",
                });
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="32"
                viewBox="0 -960 960 960"
                width="32"
              >
                <path d="M240-400h79l252-249q6-6 6-15t-6-15l-55-50q-5-5-12.5-5t-12.5 5L240-474v74Zm165 0h315v-60H465l-60 60ZM80-80v-740q0-24 18-42t42-18h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H240L80-80Z" />
              </svg>
            </button>
          </div>
          <div className="tooltip" data-tip="Need help? Email support@kennethchap.dev or visit the Chrome Extension store.">
            <button
              className="btn btn-circle btn-ghost hover:fill-[#3333ff]"
              onClick={async () => {
                await chrome.runtime.sendMessage<RequestOptions>({
                  type: "open",
                  url: "mailto:support@kennethchap.dev",
                });
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="32"
                viewBox="0 -960 960 960"
                width="32"
              >
                <path d="M140-160q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h680q24 0 42 18t18 42v520q0 24-18 42t-42 18H140Zm340-302 340-223v-55L480-522 140-740v55l340 223Z" />
              </svg>
            </button>
          </div>
          <div className="tooltip" data-tip="Consider donating!">
            <button
              className="btn btn-circle btn-ghost hover:fill-[#ff0066]"
              onClick={async () => {
                await chrome.runtime.sendMessage<RequestOptions>({
                  type: "open",
                  url: "https://www.paypal.com/donate/?hosted_button_id=JXD88LGWVURLG",
                });
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="32"
                viewBox="0 -960 960 960"
                width="32"
              >
                <path d="M646-458q-47-42-89.5-82T482-618q-32-38-51-73.5T412-760q0-52 35-87t87-35q30 0 59.5 16.5T646-821q23-28 52.5-44.5T758-882q52 0 87 35t35 87q0 33-19 68.5T810-618q-32 38-74.5 78T646-458ZM566-62l-311-89v-337h94l255 96q27 10 45.5 32.5T668-295h-64q-49 0-71.5-3T485-309l-73-24-10 28 75 26q23 8 51.5 11t58.5 3h195q57 0 77.5 22t20.5 59v26L566-62ZM40-94v-394h154v394H40Z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-sm p-3">
          Click on the <i>Subgroups</i> button to get started.{" "}
          <b>
            And if you love this extension,{" "}
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=JXD88LGWVURLG"
              target="_blank"
              rel="noreferrer noopener"
              className="link text-blue-700 hover:text-blue-500"
            >
              consider donating!
            </a>
          </b>{" "}
          ❤️
        </p>
      </div>
    </div>
  );
}
