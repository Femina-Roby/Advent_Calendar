import { notFound } from "next/navigation";
import SceneDev from "./SceneDev";

// A developer tool for scrubbing the scene. It does not exist on the public site.
export default function ScenePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SceneDev />;
}
