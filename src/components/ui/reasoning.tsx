import * as React from "react"
import { CircleCheckIcon, LoaderCircleIcon } from "lucide-react"
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
  TraceDescription,
} from "@/components/ui/trace"

interface ReasoningProps {
  text?: string
  running?: boolean
  duration?: number
}

export function Reasoning({ text, running = false, duration }: ReasoningProps) {
  const [open, setOpen] = React.useState<boolean>()

  const line = (
    <TraceLine status={running ? "running" : undefined}>
      <TraceIcon>
        {running ? (
          <LoaderCircleIcon className="animate-spin h-3.5 w-3.5" />
        ) : (
          <CircleCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
        )}
      </TraceIcon>
      <TraceTitle>{running ? "Thinking" : "Thought"}</TraceTitle>
      {!running && duration !== undefined && (
        <TraceDescription>for {duration}s</TraceDescription>
      )}
    </TraceLine>
  )

  if (!text || text.length === 0) {
    return <Trace>{line}</Trace>
  }

  return (
    <Trace>
      <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="whitespace-pre-wrap text-xs font-mono text-muted-foreground p-2 bg-muted/30 rounded border mt-1">
          {text}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}