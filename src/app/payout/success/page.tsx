import { redirect } from "next/navigation";

export default function PayoutSuccessRedirect() {
  redirect("/settle/success");
}
