import { redirect } from "next/navigation";

// "Trips" became "Campaigns" in the Campaigns rework. Keep old links working.
export default function TripsRedirect() {
  redirect("/campaigns");
}
