import "../styles/globals.css";
import type { AppProps } from "next/app";
import { createContext } from "react";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/ToastProvider";

function MyApp({ Component, pageProps }: AppProps) {
  console.log("ION_CLIENT_ID", process.env.ION_CLIENT_ID);
  return (
    <SessionProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </SessionProvider>
  );
}
export default MyApp;
