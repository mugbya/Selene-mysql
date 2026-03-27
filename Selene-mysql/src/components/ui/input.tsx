import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full px-3 py-1.5 border border-gray-400 rounded text-sm outline-none",
        "focus:border-gray-600",
        className
      )}
      {...props}
    />
  )
}

export { Input }
