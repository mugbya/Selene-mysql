import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full px-2 py-1 border border-gray-400 rounded-none text-xs outline-none",
        "focus:border-gray-600",
        className
      )}
      {...props}
    />
  )
}

export { Input }
