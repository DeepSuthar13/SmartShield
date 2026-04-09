import { redirect } from "next/navigation";

// This is a server component — instant redirect, zero JS bundle needed
export default function Home() {
  redirect("/login");
}
