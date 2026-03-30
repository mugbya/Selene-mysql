import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full px-2 py-1 border border-input rounded-none text-xs outline-none",
        "focus:border-primary",
        className
      )}
      {...props}
    />
  )
}

export { Input }
