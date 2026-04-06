// ———   frontend/src/main.tsx — Application entry point with Amplify config ———
// main.tsx is the Vite entry point — the first file executed when the app loads.
// I configured AWS Amplify here (once, at the top level) so it is available
// throughout the entire application without re-configuring in every component.

import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

// Amplify.configure - sets up the Cognito connection for the entire app.
// These values come from Vite env variables (prefixed VITE_).
// import.meta.env is Vite's equivalent of process.env in Node.js.
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      // loginWith.email: allows sign-in with email (matching User Pool config)
      loginWith: { email: true },
    },
  },
});

// QueryClient is the TanStack Query cache manager.
// Creating at the root and passing it via QueryClientProvider makes it
// available to all components via the useQuery/useMutation hooks.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: how long a cached result is considered fresh.
      // 30 seconds means the dashboard does not refetch on every re-render.
      staleTime: 30 * 1000,
      // retry: false — don't automatically retry failed requests.
      // Failed API calls surface immediately to the UI for user feedback.
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
//deploy test
