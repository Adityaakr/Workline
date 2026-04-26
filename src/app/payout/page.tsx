import { redirect } from "next/navigation";

export default function PayoutRedirect() {
  redirect("/settle");
}
