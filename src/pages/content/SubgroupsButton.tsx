import { useEffect, useState } from "react";
import "./index.css";
import { useGoogleClassroomNameStore } from "../../gc-hooks";
import { getClassroomName } from "../../gc-page-info";
import { useMultiDragAssigneesStore } from "./components/_stores";

// allow ID-based reference to modal w/o having to execute a function
declare const window: Window &
  typeof globalThis & {
    subgroups_modal: HTMLDialogElement;
  };

export default function SubgroupsButton() {
  // use hooks instead of media query to properly shrink the button when needed
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleWindowResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  const changeClassroomName = useGoogleClassroomNameStore(
    (state) => state.changeClassroomName
  );

  const resetMultiDrag = useMultiDragAssigneesStore(state => state.reset);

  return (
      <button
        className="btn font-gc-font mr-5 text-[#646464]"
        onClick={() => {
          changeClassroomName(getClassroomName());
          resetMultiDrag();
          window.subgroups_modal.showModal();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 -960 960 960"
          className="h-6 w-6"
        >
          <path
            fill="#646464"
            d="M38-160v-94q0-35 18-63.5t50-42.5q73-32 131.5-46T358-420q62 0 120 14t131 46q32 14 50.5 42.5T678-254v94H38Zm700 0v-94q0-63-32-103.5T622-423q69 8 130 23.5t99 35.5q33 19 52 47t19 63v94H738ZM358-481q-66 0-108-42t-42-108q0-66 42-108t108-42q66 0 108 42t42 108q0 66-42 108t-108 42Zm360-150q0 66-42 108t-108 42q-11 0-24.5-1.5T519-488q24-25 36.5-61.5T568-631q0-45-12.5-79.5T519-774q11-3 24.5-5t24.5-2q66 0 108 42t42 108ZM98-220h520v-34q0-16-9.5-31T585-306q-72-32-121-43t-106-11q-57 0-106.5 11T130-306q-14 6-23 21t-9 31v34Zm260-321q39 0 64.5-25.5T448-631q0-39-25.5-64.5T358-721q-39 0-64.5 25.5T268-631q0 39 25.5 64.5T358-541Zm0 321Zm0-411Z"
          />
        </svg>
        {windowWidth > 600 ? "Subgroups" : ""}
      </button>
  );
}
