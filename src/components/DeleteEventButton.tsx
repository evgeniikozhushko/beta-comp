"use client"

import React from "react"
import { useActionState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { deleteEventAction } from "@/app/events/actions"
import { toast } from "sonner"

interface Props {
    eventId: string
    eventName: string
}

export default function DeleteEventButton({ eventId, eventName }: Props) {
    const [state, action] = useActionState(deleteEventAction, {
        pending:false,
        error: "",
    })
    const [isPending, startTransition] = useTransition()

    const handleDelete = async () => {
        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete the event "${eventName}"?`)
        if (!confirmed) return;

        // Create FormData with event ID
        const formData = new FormData()
        formData.append("eventId", eventId)

        // Call the delete action within a transition
        startTransition(() => {
            action(formData)
        })
    }
    // Handle success/error states
    React.useEffect(() => {
        if (state && "success" in state && state.success) {
            toast.success(`Event "${state.name}" deleted successfully!`)

        }
        if (state && "error" in state && state.error) {
            toast.error(`Failed to delete event: ${state.error}`)
        }
    }, [state])

    return (
        <Button
            variant="secondary"
            size="sm"
            onClick={handleDelete}
            disabled={state?.pending || isPending}
            className="z-10 hover:bg-red-500 hover:text-white transition-all duration-200"
        >
            {state?.pending ? "Deleting..." : "Delete Event"}
        </Button>
    )
}
