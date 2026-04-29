import { cn } from "@/lib/utils";
import { getStatusColor } from "@/lib/utils";

export default function Badge({ status }: { status: string }) {
  return (
    <span className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize", getStatusColor(status))}>
      {status}
    </span>
  );
}
