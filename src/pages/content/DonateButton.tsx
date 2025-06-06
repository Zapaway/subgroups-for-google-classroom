import { useEffect, useState } from "react";
import "./index.css";

export default function DonateButton() {
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

  return (
    <a
      className="btn font-gc-font mr-5 text-[#646464]"
      href="https://www.paypal.com/donate/?hosted_button_id=JXD88LGWVURLG"
      target="_blank"
      rel="noreferrer noopener"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="48"
        viewBox="0 -960 960 960"
        width="48"
        className="h-6 w-6"
      >
        <path
          fill="#646464"
          d="M540-420q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM220-280q-24.75 0-42.375-17.625T160-340v-400q0-24.75 17.625-42.375T220-800h640q24.75 0 42.375 17.625T920-740v400q0 24.75-17.625 42.375T860-280H220Zm100-60h440q0-42 29-71t71-29v-200q-42 0-71-29t-29-71H320q0 42-29 71t-71 29v200q42 0 71 29t29 71Zm480 180H100q-24.75 0-42.375-17.625T40-220v-460h60v460h700v60ZM220-340v-400 400Z"
        />
      </svg>
      {windowWidth > 600 ? "Donate" : ""}
    </a>
  );
}
