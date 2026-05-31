import { redirect } from "next/navigation";

// "Community" folded into Campaigns (booked travellers live on each campaign).
export default function CommunityRedirect() {
  redirect("/campaigns");
}
