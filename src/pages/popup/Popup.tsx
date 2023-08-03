import logo from "@assets/img/logo.svg";

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
        <p className="text-sm p-3">
          Click on the <i>Subgroups</i> button to get started. <b>And if you love this
          extension, make sure to donate!</b> ❤️
        </p>
      </div>
    </div>
  );
}
