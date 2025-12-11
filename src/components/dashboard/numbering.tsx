import { handleInputChange } from "@/lib/handleInputChange";
import { useEffect, useState } from "react";
import { notify, ToastType } from "../header";
import { InputField } from "../InputField";
import OutlineButton from "../OutlineButton";
import { useSession } from "../SessionProvider";
import { Spinner } from "../Spinner";
import { useToasts } from "../ToastProvider";

export const NumberingSection = ({}) => {
  return (
    <section className="flex flex-col items-center justify-center pt-24 h-screen w-full">
      <div className="w-full h-screen overflow-y-auto">
        <iframe className="w-full h-screen" src="https://tjvmt.com/u/numbering" />
      </div>
      <br></br>
      <p className="mb-6 text-white text-xl gradient-text text-center">The current numbering leaderboard is also available at <a className="text-pink hover:underline" href="https://tjvmt.com/u/numbering">tjvmt.com/u/numbering</a>.</p>
    </section>
  );
}